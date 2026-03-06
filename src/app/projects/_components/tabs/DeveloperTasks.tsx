"use client";

import { useState } from "react";
import type { Task, UserType, UserProfile } from "@/types/projects";
import TaskModal from "../modals/TaskModal";
import TaskTimeTrackerModal from "../modals/TaskTimeTrackerModal";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import { deleteTask } from "../../actions";

interface DeveloperTasksProps {
  tasks: Task[];
  userType: UserType | null;
  projectId: string;
  profiles?: UserProfile[];
  currentUserId: string;
}

const CHILD_LEVELS: Task["level"][] = ["level_2", "level_3", "level_4"];

export default function DeveloperTasks({ tasks, userType, projectId, profiles = [], currentUserId }: DeveloperTasksProps) {
  const devTasks = tasks.filter((t) => t.type === "developer_tasks");
  const milestones = devTasks.filter((t) => t.level === "level_1" && !t.parent_task_id);

  // Build parent→children map
  const byParent = new Map<string, Task[]>();
  devTasks
    .filter((t) => t.parent_task_id)
    .forEach((t) => {
      const arr = byParent.get(t.parent_task_id!) ?? [];
      arr.push(t);
      byParent.set(t.parent_task_id!, arr);
    });

  const canEdit = userType === "admin" || userType === "manager" || userType === "developer";

  // Use a key counter so the modal always remounts fresh (fixes stale state on create/edit)
  const [modalKey, setModalKey] = useState(0);
  const [taskModal, setTaskModal] = useState<{
    open: boolean;
    task: Task | null;
    parentTaskId: string | null;
    level: Task["level"];
  }>({ open: false, task: null, parentTaskId: null, level: "level_1" });

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const [timeTrackerModal, setTimeTrackerModal] = useState<{
    open: boolean;
    taskId: string;
    taskName: string;
  }>({ open: false, taskId: "", taskName: "" });

  const openCreate = (parentTaskId: string | null, level: Task["level"]) => {
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, task: null, parentTaskId, level });
  };

  const openEdit = (task: Task) => {
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, task, parentTaskId: task.parent_task_id, level: task.level });
  };

  const openTimeTracker = (task: Task) => {
    setTimeTrackerModal({ open: true, taskId: task.id, taskName: task.name ?? "Task" });
  };

  return (
    <div className="flex flex-col">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_120px_100px_100px_80px_80px_120px_64px] gap-2 px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border">
        <span>Name</span>
        <span>Status</span>
        <span>Start Date</span>
        <span>End Date</span>
        <span>Est. (h)</span>
        <span>Real (h)</span>
        <span>Assignees</span>
        <span />
      </div>

      {milestones.length === 0 && <EmptyState message="No developer tasks yet." />}

      {milestones.map((milestone, idx) => (
        <MilestoneRow
          key={milestone.id}
          milestone={milestone}
          idx={idx + 1}
          byParent={byParent}
          canEdit={canEdit}
          onEdit={openEdit}
          onDelete={(t) => setDeleteModal({ open: true, task: t })}
          onAddChild={openCreate}
          onOpenTimeTracker={openTimeTracker}
        />
      ))}

      {canEdit && (
        <button
          onClick={() => openCreate(null, "level_1")}
          className="flex items-center gap-2 px-4 py-3 text-sm text-text-muted hover:text-text-secondary transition-colors border-t border-border"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add milestone
        </button>
      )}

      <TaskModal
        key={modalKey}
        open={taskModal.open}
        onClose={() => setTaskModal((s) => ({ ...s, open: false }))}
        task={taskModal.task}
        projectId={projectId}
        parentTaskId={taskModal.parentTaskId}
        type="developer_tasks"
        level={taskModal.level ?? "level_1"}
        profiles={profiles}
        currentUserId={currentUserId}
      />

      <TaskTimeTrackerModal
        open={timeTrackerModal.open}
        onClose={() => setTimeTrackerModal((s) => ({ ...s, open: false }))}
        taskId={timeTrackerModal.taskId}
        projectId={projectId}
        taskName={timeTrackerModal.taskName}
      />

      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, task: null })}
        kind="task"
        itemName={deleteModal.task?.name ?? ""}
        onConfirm={() => deleteTask(deleteModal.task!.id)}
      />
    </div>
  );
}

// ── Milestone row ─────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone, idx, byParent, canEdit, onEdit, onDelete, onAddChild, onOpenTimeTracker,
}: {
  milestone: Task;
  idx: number;
  byParent: Map<string, Task[]>;
  canEdit: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onAddChild: (parentId: string, level: Task["level"]) => void;
  onOpenTimeTracker: (t: Task) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = (byParent.get(milestone.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      <div className="grid grid-cols-[1fr_120px_100px_100px_80px_80px_120px_64px] gap-2 px-4 py-3 bg-accent/10 border-b border-border items-center group">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-4 h-4 shrink-0 text-text-muted hover:text-text-primary transition-transform"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 4.707a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-text-primary truncate">
            Milestone {idx}: {milestone.name}
          </span>
        </div>
        <StatusBadge status={milestone.status} />
        <DateCell value={milestone.start_date_real ?? milestone.start_date_estimated} />
        <DateCell value={milestone.end_date_real ?? milestone.end_date_estimated} />
        <NumCell value={milestone.estimated_time} />
        <RealTimeCell value={milestone.real_time} onClick={() => onOpenTimeTracker(milestone)} />
        <Assignees assignees={milestone.task_assignees} />
        <RowActions canEdit={canEdit} onEdit={() => onEdit(milestone)} onDelete={() => onDelete(milestone)} />
      </div>

      {expanded && (
        <>
          {children.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              depth={1}
              byParent={byParent}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onOpenTimeTracker={onOpenTimeTracker}
            />
          ))}
          {canEdit && (
            <button
              onClick={() => onAddChild(milestone.id, "level_2")}
              className="flex items-center gap-2 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors border-b border-border/50"
              style={{ paddingLeft: `${16 + 24}px` }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          )}
        </>
      )}
    </>
  );
}

// ── Task row (recursive) ───────────────────────────────────────────────────────

function TaskRow({
  task, depth, byParent, canEdit, onEdit, onDelete, onAddChild, onOpenTimeTracker,
}: {
  task: Task;
  depth: number; // 1 = level_2, 2 = level_3, 3 = level_4
  byParent: Map<string, Task[]>;
  canEdit: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onAddChild: (parentId: string, level: Task["level"]) => void;
  onOpenTimeTracker: (t: Task) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = (byParent.get(task.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hasChildren = children.length > 0;
  const childLevel = CHILD_LEVELS[depth] as Task["level"] | undefined; // next level

  return (
    <>
      <div
        className="grid grid-cols-[1fr_120px_100px_100px_80px_80px_120px_64px] gap-2 px-4 py-2.5 border-b border-border/50 items-center hover:bg-muted/30 transition-colors group"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-4 h-4 shrink-0 text-text-muted hover:text-text-primary transition-transform"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 4.707a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <span className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm text-text-primary truncate">{task.name}</span>
        </div>
        <StatusBadge status={task.status} />
        <DateCell value={task.start_date_real ?? task.start_date_estimated} />
        <DateCell value={task.end_date_real ?? task.end_date_estimated} />
        <NumCell value={task.estimated_time} />
        <RealTimeCell value={task.real_time} onClick={() => onOpenTimeTracker(task)} />
        <Assignees assignees={task.task_assignees} />
        <RowActions canEdit={canEdit} onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />
      </div>

      {(expanded || hasChildren) && expanded && (
        <>
          {children.map((child) => (
            <TaskRow
              key={child.id}
              task={child}
              depth={depth + 1}
              byParent={byParent}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onOpenTimeTracker={onOpenTimeTracker}
            />
          ))}
          {/* Show "Add sub-task" button as long as there's a next level */}
          {canEdit && childLevel && (
            <button
              onClick={() => onAddChild(task.id, childLevel)}
              className="flex items-center gap-2 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors border-b border-border/50"
              style={{ paddingLeft: `${16 + (depth + 1) * 24}px` }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add sub-task
            </button>
          )}
        </>
      )}
    </>
  );
}

// ── Shared cells ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Task["status"] }) {
  const map: Record<Task["status"], string> = {
    not_started:  "bg-[#27272a] text-[#a1a1aa]",
    in_progress:  "bg-[#1d3f7a] text-[#93c5fd]",
    ready_for_qa: "bg-[#4c1d95] text-[#d8b4fe]",
    done:         "bg-[#14532d] text-[#86efac]",
    blocked:      "bg-[#7f1d1d] text-[#fca5a5]",
  };
  const label: Record<Task["status"], string> = {
    not_started:  "Not Started",
    in_progress:  "In Progress",
    ready_for_qa: "Ready for QA",
    done:         "Done",
    blocked:      "Blocked",
  };
  return <span className={`status-badge text-[10px] ${map[status]}`}>{label[status]}</span>;
}

function DateCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-xs text-text-muted">—</span>;
  return (
    <span className="text-xs text-text-secondary">
      {new Date(value).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
    </span>
  );
}

function NumCell({ value }: { value: number | null | undefined }) {
  return <span className="text-xs text-text-secondary">{value != null ? value.toFixed(2) : "0.00"}</span>;
}

function RealTimeCell({ value, onClick }: { value: number | null | undefined; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-text-secondary hover:text-accent transition-colors text-left"
      title="View time tracker"
    >
      {value != null ? value.toFixed(2) : "0.00"}
    </button>
  );
}

function Assignees({ assignees }: { assignees: Task["task_assignees"] }) {
  if (!assignees.length) return <span className="text-xs text-text-muted">—</span>;
  return (
    <div className="flex items-center -space-x-1.5">
      {assignees.slice(0, 4).map((a) => {
        const p = a.profiles;
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "?";
        const initial = name[0]?.toUpperCase() ?? "?";
        return (
          <div
            key={a.user_id}
            className="w-6 h-6 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center border-2 border-elevated overflow-hidden"
            title={name}
          >
            {p?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.picture} alt={name} className="w-full h-full object-cover" />
            ) : initial}
          </div>
        );
      })}
      {assignees.length > 4 && (
        <div className="w-6 h-6 rounded-full bg-muted text-text-muted text-[10px] flex items-center justify-center border-2 border-elevated">
          +{assignees.length - 4}
        </div>
      )}
    </div>
  );
}

function RowActions({ canEdit, onEdit, onDelete }: { canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  if (!canEdit) return null;
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={onEdit} className="p-1 text-text-muted hover:text-text-primary transition-colors" title="Edit">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button onClick={onDelete} className="p-1 text-text-muted hover:text-red-400 transition-colors" title="Delete">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}
