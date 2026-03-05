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
} from "@/types/projects";

// ── Project CRUD ──────────────────────────────────────────────────────────────

export interface ProjectInput {
  name: string;
  status: ProjectStatus;
  program: ProjectProgram | null;
  stage: ProjectStage | null;
  estimated_time: number | null;
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

  revalidatePath("/projects");
  return {};
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("task").delete().eq("id", id);
  if (error) return { error: error.message };
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
    revalidatePath("/projects");
    return { id: entry.id };
  }

  const { data: row, error } = await supabase
    .from("time_track")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { id: row.id };
}

export async function deleteTimeEntry(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("time_track").delete().eq("id", id);
  if (error) return { error: error.message };
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
    revalidatePath("/projects");
    return { id: entry.id };
  }

  const { data: row, error } = await supabase
    .from("qa_time_track")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { id: row.id };
}

export async function deleteQATimeEntry(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("qa_time_track").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}
