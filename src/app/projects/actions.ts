"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ProjectStatus,
  ProjectProgram,
  ProjectStage,
  TaskStatus,
  TaskType,
  TaskLevel,
  Talent,
  TalentLevel,
  TalentAuthorityLevel,
} from "@/types/projects";

// ── Project CRUD ──────────────────────────────────────────────────────────────

export interface ProjectInput {
  name: string;
  status: ProjectStatus;
  program: ProjectProgram | null;
  stage: ProjectStage | null;
  estimated_time: number | null;
  real_time: number | null;
  price: number | null;
  referrer_commission: number | null;
  start_date_estimated: string | null;
  end_date_estimated: string | null;
  start_date_real: string | null;
  end_date_real: string | null;
  description: string | null;
  authorized_users: string[];
  change_automatically_project_estimated_time: boolean;
  change_automatically_milestone_estimated_time: boolean;
  change_automatically_project_start_end_dates: boolean;
  change_automatically_milestone_start_end_dates: boolean;
  talent_who_recommended_id: string | null;
  company_that_recommended_id: string | null;
}

export async function createProject(data: ProjectInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("project")
    .insert(data)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { id: row.id };
}

export async function updateProject(
  id: string,
  data: Partial<ProjectInput>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

// ── Task CRUD ─────────────────────────────────────────────────────────────────

export interface TaskInput {
  name: string;
  project_id: string;
  parent_task_id: string | null;
  type: TaskType;
  level: TaskLevel;
  status: TaskStatus;
  estimated_time: number | null;
  start_date_estimated: string | null;
  end_date_estimated: string | null;
  start_date_real: string | null;
  end_date_real: string | null;
  order: number | null;
  assignee_ids: string[];
}

export async function createTask(data: TaskInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { assignee_ids, ...taskData } = data;

  const { data: row, error } = await supabase
    .from("task")
    .insert(taskData)
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (assignee_ids.length > 0) {
    await supabase.from("task_assignees").insert(
      assignee_ids.map((user_id) => ({ task_id: row.id, user_id }))
    );
  }

  // Recalculate aggregates after creating a task
  if (data.project_id) {
    await recalculateAggregates(data.project_id);
  }

  revalidatePath("/projects");
  return { id: row.id };
}

export async function updateTask(
  id: string,
  data: Partial<TaskInput>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { assignee_ids, ...taskData } = data;

  if (Object.keys(taskData).length > 0) {
    const { error } = await supabase.from("task").update(taskData).eq("id", id);
    if (error) return { error: error.message };
  }

  if (assignee_ids !== undefined) {
    await supabase.from("task_assignees").delete().eq("task_id", id);
    if (assignee_ids.length > 0) {
      await supabase.from("task_assignees").insert(
        assignee_ids.map((user_id) => ({ task_id: id, user_id }))
      );
    }
  }

  // Recalculate aggregates if estimated_time or dates changed
  if (taskData.estimated_time !== undefined || taskData.start_date_estimated !== undefined || taskData.end_date_estimated !== undefined) {
    // Fetch project_id for this task
    const { data: taskRow } = await supabase.from("task").select("project_id").eq("id", id).single();
    if (taskRow?.project_id) {
      await recalculateAggregates(taskRow.project_id);
    }
  }

  revalidatePath("/projects");
  return {};
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  // 1. Fetch task to get project_id
  const { data: task } = await supabase.from("task").select("id, project_id").eq("id", id).single();
  if (!task) return { error: "Task not found" };

  // 2. Collect all descendant IDs recursively
  const allIds: string[] = [];
  const queue = [id];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    allIds.push(parentId);
    const { data: children } = await supabase
      .from("task")
      .select("id")
      .eq("parent_task_id", parentId);
    if (children) {
      for (const c of children) queue.push(c.id);
    }
  }

  // 3. Delete related data first, then tasks (deepest children first)
  await supabase.from("task_comment").delete().in("task_id", allIds);
  await supabase.from("time_track").delete().in("task_id", allIds);
  await supabase.from("qa_time_track").delete().in("task_id", allIds);
  await supabase.from("task_assignees").delete().in("task_id", allIds);
  // Delete in reverse order (children first) to avoid FK violations
  for (const taskId of allIds.reverse()) {
    await supabase.from("task").delete().eq("id", taskId);
  }

  // 4. Recalculate aggregates
  if (task.project_id) {
    await recalculateAggregates(task.project_id);
    await recalculateRealTime(task.project_id);
  }

  revalidatePath("/projects");
  return {};
}

// ── Aggregation Utilities ────────────────────────────────────────────────────

/**
 * Bottom-up rollup of estimated_time and estimated dates through the task hierarchy,
 * then project-level rollup, then client_milestone_total.estimated_time_h.
 */
export async function recalculateAggregates(projectId: string): Promise<void> {
  const supabase = await createClient();

  // Fetch project flags
  const { data: project } = await supabase
    .from("project")
    .select("id, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates")
    .eq("id", projectId)
    .single();
  if (!project) return;

  // Fetch all tasks for the project
  const { data: tasks } = await supabase
    .from("task")
    .select("id, parent_task_id, level, type, estimated_time, start_date_estimated, end_date_estimated")
    .eq("project_id", projectId);
  if (!tasks) return;

  // Build parent→children map
  const byParent = new Map<string, typeof tasks>();
  const taskMap = new Map<string, (typeof tasks)[0]>();
  for (const t of tasks) {
    taskMap.set(t.id, t);
    if (t.parent_task_id) {
      const arr = byParent.get(t.parent_task_id) ?? [];
      arr.push(t);
      byParent.set(t.parent_task_id, arr);
    }
  }

  // Bottom-up rollup: process leaf tasks first, then parents
  // Build processing order using topological sort (children before parents)
  const order: string[] = [];
  const visited = new Set<string>();
  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const children = byParent.get(id) ?? [];
    for (const c of children) visit(c.id);
    order.push(id);
  }
  for (const t of tasks) visit(t.id);

  const updates: { id: string; estimated_time?: number | null; start_date_estimated?: string | null; end_date_estimated?: string | null }[] = [];

  for (const id of order) {
    const t = taskMap.get(id)!;
    const children = byParent.get(id) ?? [];
    if (children.length === 0) continue; // leaf — skip

    // For level_1 (milestones): only auto-update if project flags allow
    const isMilestone = t.level === "level_1";
    const autoEst = isMilestone ? project.change_automatically_milestone_estimated_time : true;
    const autoDates = isMilestone ? project.change_automatically_milestone_start_end_dates : true;

    // For milestones with client/qa: only sum developer_tasks children for est rollup
    // (client_requests/qa_requests under milestones are handled separately)
    const relevantChildren = isMilestone
      ? children.filter((c) => c.type === "developer_tasks" || c.level === "level_2")
      : children;

    const update: (typeof updates)[0] = { id };
    let changed = false;

    if (autoEst) {
      const estSum = relevantChildren.reduce((s, c) => s + (c.estimated_time ?? 0), 0);
      const newEst = estSum || null;
      if (t.estimated_time !== newEst) {
        update.estimated_time = newEst;
        t.estimated_time = newEst; // update in-memory for parent rollup
        changed = true;
      }
    }

    if (autoDates) {
      const starts = relevantChildren.map((c) => c.start_date_estimated).filter(Boolean) as string[];
      const ends = relevantChildren.map((c) => c.end_date_estimated).filter(Boolean) as string[];
      const minStart = starts.length > 0 ? starts.sort()[0] : null;
      const maxEnd = ends.length > 0 ? ends.sort().reverse()[0] : null;
      if (t.start_date_estimated !== minStart) {
        update.start_date_estimated = minStart;
        t.start_date_estimated = minStart;
        changed = true;
      }
      if (t.end_date_estimated !== maxEnd) {
        update.end_date_estimated = maxEnd;
        t.end_date_estimated = maxEnd;
        changed = true;
      }
    }

    if (changed) updates.push(update);
  }

  // Batch task updates
  for (const u of updates) {
    const { id: taskId, ...data } = u;
    if (Object.keys(data).length > 0) {
      await supabase.from("task").update(data).eq("id", taskId);
    }
  }

  // Project-level rollup from milestones
  const milestones = tasks.filter((t) => t.level === "level_1" && !t.parent_task_id);
  const projectUpdate: Record<string, unknown> = {};

  if (project.change_automatically_project_estimated_time) {
    projectUpdate.estimated_time = milestones.reduce((s, m) => s + (taskMap.get(m.id)!.estimated_time ?? 0), 0) || null;
  }
  if (project.change_automatically_project_start_end_dates) {
    const starts = milestones.map((m) => taskMap.get(m.id)!.start_date_estimated).filter(Boolean) as string[];
    const ends = milestones.map((m) => taskMap.get(m.id)!.end_date_estimated).filter(Boolean) as string[];
    projectUpdate.start_date_estimated = starts.length > 0 ? starts.sort()[0] : null;
    projectUpdate.end_date_estimated = ends.length > 0 ? ends.sort().reverse()[0] : null;
  }
  if (Object.keys(projectUpdate).length > 0) {
    await supabase.from("project").update(projectUpdate).eq("id", projectId);
  }

  // Update client_milestone_total.estimated_time_h per milestone
  for (const m of milestones) {
    const childTasks = byParent.get(m.id) ?? [];
    const clientEst = childTasks
      .filter((c) => c.type === "client_requests")
      .reduce((s, c) => s + (c.estimated_time ?? 0), 0);

    // Upsert client_milestone_total
    const { data: existing } = await supabase
      .from("client_milestone_total")
      .select("id")
      .eq("task_milestone_id", m.id)
      .eq("project_id", projectId)
      .limit(1)
      .single();
    if (existing) {
      await supabase.from("client_milestone_total").update({ estimated_time_h: clientEst || null }).eq("id", existing.id);
    } else if (clientEst > 0) {
      await supabase.from("client_milestone_total").insert({ task_milestone_id: m.id, project_id: projectId, estimated_time_h: clientEst });
    }
  }
}

/**
 * Recalculates real_time, start_date_real, end_date_real for all tasks and the project,
 * plus client/qa milestone total real time fields.
 */
export async function recalculateRealTime(projectId: string): Promise<void> {
  const supabase = await createClient();

  // Fetch all tasks
  const { data: tasks } = await supabase
    .from("task")
    .select("id, parent_task_id, level, type")
    .eq("project_id", projectId);
  if (!tasks) return;

  // Fetch all time_track entries
  const { data: timeEntries } = await supabase
    .from("time_track")
    .select("task_id, time_spent_h, start_date")
    .eq("project_id", projectId);

  // Fetch all qa_time_track entries
  const { data: qaTimeEntries } = await supabase
    .from("qa_time_track")
    .select("task_id, time_spent_h, start_date")
    .eq("project_id", projectId);

  const ttEntries = timeEntries ?? [];
  const qaEntries = qaTimeEntries ?? [];

  // Per-task aggregation from time_track
  const taskTimeMap = new Map<string, { total: number; minDate: string | null; maxDate: string | null }>();
  for (const e of ttEntries) {
    if (!e.task_id) continue;
    const cur = taskTimeMap.get(e.task_id) ?? { total: 0, minDate: null, maxDate: null };
    cur.total += e.time_spent_h ?? 0;
    if (e.start_date) {
      if (!cur.minDate || e.start_date < cur.minDate) cur.minDate = e.start_date;
      if (!cur.maxDate || e.start_date > cur.maxDate) cur.maxDate = e.start_date;
    }
    taskTimeMap.set(e.task_id, cur);
  }

  // Update each task's real_time and real dates
  for (const t of tasks) {
    const agg = taskTimeMap.get(t.id);
    await supabase.from("task").update({
      real_time: agg ? agg.total : 0,
      start_date_real: agg?.minDate ?? null,
      end_date_real: agg?.maxDate ?? null,
    }).eq("id", t.id);
  }

  // Project real_time
  const projectRealTime = ttEntries.reduce((s, e) => s + (e.time_spent_h ?? 0), 0);
  await supabase.from("project").update({ real_time: projectRealTime }).eq("id", projectId);

  // Milestone-level totals for client/qa
  const milestones = tasks.filter((t) => t.level === "level_1" && !t.parent_task_id);
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  // Build milestone→descendant task IDs map
  const milestoneTaskIds = new Map<string, Set<string>>();
  for (const m of milestones) milestoneTaskIds.set(m.id, new Set());
  for (const t of tasks) {
    if (!t.parent_task_id) continue;
    // Walk up to find milestone
    let current = t;
    while (current.parent_task_id && taskById.has(current.parent_task_id)) {
      const parent = taskById.get(current.parent_task_id)!;
      if (parent.level === "level_1") {
        milestoneTaskIds.get(parent.id)?.add(t.id);
        break;
      }
      current = parent;
    }
  }

  for (const m of milestones) {
    const descIds = milestoneTaskIds.get(m.id) ?? new Set();

    // client_milestone_total.real_time_h = sum of time_track for client_requests tasks
    const clientRealTime = ttEntries
      .filter((e) => e.task_id && descIds.has(e.task_id) && taskById.get(e.task_id)?.type === "client_requests")
      .reduce((s, e) => s + (e.time_spent_h ?? 0), 0);

    // qa_milestone_total.developer_real_time_h = sum of time_track for qa_requests tasks
    const qaDevRealTime = ttEntries
      .filter((e) => e.task_id && descIds.has(e.task_id) && taskById.get(e.task_id)?.type === "qa_requests")
      .reduce((s, e) => s + (e.time_spent_h ?? 0), 0);

    // qa_milestone_total.qa_real_time_h = sum of qa_time_track for tasks under milestone
    const qaQaRealTime = qaEntries
      .filter((e) => e.task_id && descIds.has(e.task_id))
      .reduce((s, e) => s + (e.time_spent_h ?? 0), 0);

    // Upsert client_milestone_total
    const { data: cmt } = await supabase
      .from("client_milestone_total")
      .select("id")
      .eq("task_milestone_id", m.id)
      .eq("project_id", projectId)
      .limit(1)
      .single();
    if (cmt) {
      await supabase.from("client_milestone_total").update({ real_time_h: clientRealTime || null }).eq("id", cmt.id);
    } else if (clientRealTime > 0) {
      await supabase.from("client_milestone_total").insert({ task_milestone_id: m.id, project_id: projectId, real_time_h: clientRealTime });
    }

    // Upsert qa_milestone_total
    const { data: qmt } = await supabase
      .from("qa_milestone_total")
      .select("id")
      .eq("task_milestone_id", m.id)
      .eq("project_id", projectId)
      .limit(1)
      .single();
    if (qmt) {
      await supabase.from("qa_milestone_total").update({
        developer_real_time_h: qaDevRealTime || null,
        qa_real_time_h: qaQaRealTime || null,
      }).eq("id", qmt.id);
    } else if (qaDevRealTime > 0 || qaQaRealTime > 0) {
      await supabase.from("qa_milestone_total").insert({
        task_milestone_id: m.id,
        project_id: projectId,
        developer_real_time_h: qaDevRealTime || null,
        qa_real_time_h: qaQaRealTime || null,
      });
    }
  }
}

// ── Milestone Total CRUD ─────────────────────────────────────────────────────

export async function updateClientMilestoneTotal(
  milestoneId: string,
  projectId: string,
  data: { estimated_time_h?: number | null }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("client_milestone_total")
    .select("id")
    .eq("task_milestone_id", milestoneId)
    .eq("project_id", projectId)
    .limit(1)
    .single();
  if (existing) {
    const { error } = await supabase.from("client_milestone_total").update(data).eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("client_milestone_total").insert({
      task_milestone_id: milestoneId,
      project_id: projectId,
      ...data,
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/projects");
  return {};
}

export async function updateQAMilestoneTotal(
  milestoneId: string,
  projectId: string,
  data: { developer_estimated_time_h?: number | null; qa_estimated_time_h?: number | null }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("qa_milestone_total")
    .select("id")
    .eq("task_milestone_id", milestoneId)
    .eq("project_id", projectId)
    .limit(1)
    .single();
  if (existing) {
    const { error } = await supabase.from("qa_milestone_total").update(data).eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("qa_milestone_total").insert({
      task_milestone_id: milestoneId,
      project_id: projectId,
      ...data,
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/projects");
  return {};
}

// ── Developer Time Track ──────────────────────────────────────────────────────

export interface TimeEntryInput {
  id?: string;
  task_id: string;
  project_id: string;
  start_date: string;
  start_time_min: number;
  end_time_min: number;
  time_spent_h: number;
}

export async function upsertTimeEntry(entry: TimeEntryInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const payload = {
    owner_id: user.id,
    task_id: entry.task_id,
    project_id: entry.project_id,
    start_date: entry.start_date,
    start_time_min: entry.start_time_min,
    end_time_min: entry.end_time_min,
    time_spent_h: entry.time_spent_h,
  };

  if (entry.id) {
    const { error } = await supabase.from("time_track").update(payload).eq("id", entry.id);
    if (error) return { error: error.message };
    await recalculateRealTime(entry.project_id);
    revalidatePath("/projects");
    return { id: entry.id };
  }

  const { data: row, error } = await supabase
    .from("time_track")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: error.message };
  await recalculateRealTime(entry.project_id);
  revalidatePath("/projects");
  return { id: row.id };
}

export async function deleteTimeEntry(id: string, projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("time_track").delete().eq("id", id);
  if (error) return { error: error.message };
  await recalculateRealTime(projectId);
  revalidatePath("/projects");
  return {};
}

// ── QA Time Track ─────────────────────────────────────────────────────────────

export interface QATimeEntryInput {
  id?: string;
  task_id: string;
  project_id: string;
  start_date: string;
  start_time_min: number;
  end_time_min: number;
  time_spent_h: number;
}

export async function upsertQATimeEntry(
  entry: QATimeEntryInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const payload = {
    owner_user_id: user.id,
    task_id: entry.task_id,
    project_id: entry.project_id,
    start_date: entry.start_date,
    start_time_min: entry.start_time_min,
    end_time_min: entry.end_time_min,
    time_spent_h: entry.time_spent_h,
  };

  if (entry.id) {
    const { error } = await supabase.from("qa_time_track").update(payload).eq("id", entry.id);
    if (error) return { error: error.message };
    await recalculateRealTime(entry.project_id);
    revalidatePath("/projects");
    return { id: entry.id };
  }

  const { data: row, error } = await supabase
    .from("qa_time_track")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: error.message };
  await recalculateRealTime(entry.project_id);
  revalidatePath("/projects");
  return { id: row.id };
}

export async function deleteQATimeEntry(id: string, projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("qa_time_track").delete().eq("id", id);
  if (error) return { error: error.message };
  await recalculateRealTime(projectId);
  revalidatePath("/projects");
  return {};
}

export async function getTaskComments(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_comment")
    .select("id, task_id, project_id, owner_id, message, created_at, profiles(id, first_name, last_name, picture)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as import("@/types/projects").TaskComment[];
}

export async function createTaskComment(
  taskId: string,
  projectId: string,
  message: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: row, error } = await supabase
    .from("task_comment")
    .insert({ task_id: taskId, project_id: projectId, owner_id: user.id, message })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: row.id };
}

export async function getTaskTimeEntries(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_track")
    .select("id, owner_id, task_id, project_id, start_date, start_time_min, end_time_min, time_spent_h, profiles(id, first_name, last_name, picture)")
    .eq("task_id", taskId)
    .order("start_date", { ascending: true });
  return (data ?? []) as unknown as import("@/types/projects").TimeTrack[];
}

// ── Talent ────────────────────────────────────────────────────────────────────

export async function searchTalents(query: string): Promise<Talent[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent")
    .select("id, name, email, level, current_company_id")
    .ilike("name", `%${query.trim()}%`)
    .limit(10);
  return (data ?? []) as unknown as Talent[];
}

export async function getTalentById(id: string): Promise<Talent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent")
    .select("id, name, email, level, current_company_id")
    .eq("id", id)
    .single();
  return (data ?? null) as unknown as Talent | null;
}

export interface TalentInput {
  name: string;
  email: string | null;
  level: TalentLevel | null;
  authority_level: TalentAuthorityLevel | null;
  current_company_id: string | null;
}

export async function createTalent(data: TalentInput): Promise<{ error?: string; id?: string; talent?: Talent }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("talent")
    .insert(data)
    .select("id, name, email, level, current_company_id")
    .single();
  if (error) return { error: error.message };
  return { id: (row as any).id, talent: row as unknown as Talent };
}

// ── Company ───────────────────────────────────────────────────────────────────

export async function searchCompanies(query: string): Promise<{ id: string; name: string }[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("company")
    .select("id, name")
    .ilike("name", `%${query.trim()}%`)
    .limit(10);
  return (data ?? []) as { id: string; name: string }[];
}

export async function createCompany(name: string, website?: string | null): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("company")
    .insert({ name, website: website ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: row.id };
}
