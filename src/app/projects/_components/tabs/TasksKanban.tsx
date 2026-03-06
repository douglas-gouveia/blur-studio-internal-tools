"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Task, UserType, UserProfile } from "@/types/projects";
import TaskModal from "../modals/TaskModal";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import { deleteTask, updateTask } from "../../actions";

interface TasksKanbanProps {
  tasks: Task[];
  userType: UserType | null;
  projectId: string;
  /** "client_requests" | "qa_requests" */
  type: "client_requests" | "qa_requests";
  onTrackQATime?: () => void;
  profiles?: UserProfile[];
  currentUserId: string;
}

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "not_started",  label: "Not Started" },
  { key: "in_progress",  label: "In Progress" },
  { key: "ready_for_qa", label: "Ready for QA" },
  { key: "done",         label: "Done" },
  { key: "blocked",      label: "Blocked" },
];

const COLUMN_ACCENT: Record<Task["status"], string> = {
  not_started:  "border-t-[#52525b]",
  in_progress:  "border-t-[#3b82f6]",
  ready_for_qa: "border-t-[#a855f7]",
  done:         "border-t-[#22c55e]",
  blocked:      "border-t-[#ef4444]",
};

export default function TasksKanban({
  tasks, userType, projectId, type, onTrackQATime, profiles = [], currentUserId,
}: TasksKanbanProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const canEdit = userType === "admin" || userType === "manager" || userType === "developer" || userType === "qa";

  // Store only IDs — derive task objects from localTasks at render time to avoid stale data
  const [taskModal, setTaskModal] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [modalKey, setModalKey] = useState(0);

  // Local tasks for optimistic drag-drop updates
  const [localTasks, setLocalTasks] = useState<Task[]>(() => tasks.filter((t) => t.type === type));
  useEffect(() => { setLocalTasks(tasks.filter((t) => t.type === type)); }, [tasks, type]);

  // Drag state — ref for the dragging ID so state update doesn't cancel the drag
  const draggingIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task["status"] | null>(null);

  const byStatus = new Map<Task["status"], Task[]>();
  COLUMNS.forEach(({ key }) => byStatus.set(key, []));
  localTasks.forEach((t) => {
    const col = byStatus.get(t.status) ?? [];
    col.push(t);
    byStatus.set(t.status, col);
  });

  // Derive task objects from localTasks so they're always fresh
  const modalTask = taskModal.taskId ? (localTasks.find((t) => t.id === taskModal.taskId) ?? null) : null;
  const deleteTask_ = deleteModal.taskId ? (localTasks.find((t) => t.id === deleteModal.taskId) ?? null) : null;

  function openCreate() {
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, taskId: null });
  }

  function openEdit(taskId: string) {
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, taskId });
  }

  function handleDrop(targetStatus: Task["status"], taskId: string) {
    const task = localTasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) {
      draggingIdRef.current = null;
      setDraggingId(null);
      setDragOverStatus(null);
      return;
    }
    const targetCol = byStatus.get(targetStatus) ?? [];
    const newOrder = targetCol.length;

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: targetStatus, order: newOrder } : t)
    );
    draggingIdRef.current = null;
    setDraggingId(null);
    setDragOverStatus(null);

    startTransition(async () => {
      await updateTask(taskId, { status: targetStatus, order: newOrder });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {type === "qa_requests" && canEdit && (
        <div className="flex justify-end">
          <button
            onClick={onTrackQATime}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Track QA Time
          </button>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map(({ key, label }) => {
          const col = (byStatus.get(key) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const isOver = dragOverStatus === key;
          return (
            <div
              key={key}
              className={`flex flex-col gap-2 min-w-[220px] max-w-[220px] rounded-lg border border-border border-t-2 transition-colors ${COLUMN_ACCENT[key]} ${isOver ? "bg-muted/60" : "bg-surface"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStatus(key); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverStatus(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("taskId");
                if (taskId) handleDrop(key, taskId);
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-xs text-text-muted bg-muted rounded-full px-1.5 py-0.5 leading-none">
                  {col.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 px-2 pb-2 min-h-[120px]">
                {col.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    canEdit={canEdit}
                    isDragging={draggingId === task.id}
                    onEdit={() => openEdit(task.id)}
                    onDelete={() => setDeleteModal({ open: true, taskId: task.id })}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("taskId", task.id);
                      draggingIdRef.current = task.id;
                      // Defer state update so React doesn't re-render during drag init
                      setTimeout(() => setDraggingId(task.id), 0);
                    }}
                    onDragEnd={() => {
                      draggingIdRef.current = null;
                      setDraggingId(null);
                      setDragOverStatus(null);
                    }}
                  />
                ))}
                {col.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-4">No tasks</p>
                )}
              </div>

              {/* Add card button */}
              {canEdit && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors border-t border-border"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <TaskModal
        key={modalKey}
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, taskId: null })}
        task={modalTask}
        projectId={projectId}
        parentTaskId={null}
        type={type}
        level="level_2"
        profiles={profiles}
        currentUserId={currentUserId}
      />
      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, taskId: null })}
        kind="task"
        itemName={deleteTask_?.name ?? ""}
        onConfirm={() => deleteTask(deleteModal.taskId!)}
      />
    </div>
  );
}

function KanbanCard({
  task, canEdit, isDragging, onEdit, onDelete, onDragStart, onDragEnd,
}: {
  task: Task;
  canEdit: boolean;
  isDragging: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={canEdit}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-elevated rounded-md border border-border p-3 group transition-colors select-none ${
        canEdit ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-40 scale-95" : "hover:border-accent/40"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-text-primary leading-snug flex-1 min-w-0">
          {task.name ?? "Untitled"}
        </p>
        {canEdit && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 text-text-muted hover:text-text-primary transition-colors rounded"
              title="Edit"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-text-muted hover:text-red-400 transition-colors rounded"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Footer: assignees + time */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
        <Assignees assignees={task.task_assignees} />
        {task.estimated_time != null && (
          <span className="text-[10px] text-text-muted">
            {task.estimated_time.toFixed(0)}h est.
          </span>
        )}
      </div>
    </div>
  );
}

function Assignees({ assignees }: { assignees: Task["task_assignees"] }) {
  if (!assignees.length) return <span />;
  return (
    <div className="flex items-center -space-x-1">
      {assignees.slice(0, 3).map((a) => {
        const p = a.profiles;
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "?";
        const initial = name[0]?.toUpperCase() ?? "?";
        return (
          <div
            key={a.user_id}
            className="w-5 h-5 rounded-full bg-accent text-white text-[9px] font-semibold flex items-center justify-center border-2 border-elevated overflow-hidden"
            title={name}
          >
            {p?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.picture} alt={name} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        );
      })}
      {assignees.length > 3 && (
        <div className="w-5 h-5 rounded-full bg-muted text-text-muted text-[9px] flex items-center justify-center border-2 border-elevated">
          +{assignees.length - 3}
        </div>
      )}
    </div>
  );
}
