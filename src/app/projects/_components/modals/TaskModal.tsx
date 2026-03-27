"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import DatePicker from "@/components/DatePicker";
import type {
  Task,
  TaskStatus,
  TaskType,
  TaskLevel,
  TimeTrack,
  UserProfile,
  TaskComment,
} from "@/types/projects";
import { TIME_OPTIONS, minToTimeStr, timeStrToMin } from "@/types/projects";
import {
  createTask,
  updateTask,
  upsertTimeEntry,
  deleteTimeEntry,
  getTaskComments,
  createTaskComment,
  type TaskInput,
} from "../../actions";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  /** null = create mode */
  task?: Task | null;
  projectId: string;
  parentTaskId?: string | null;
  type: TaskType;
  level: TaskLevel;
  profiles: UserProfile[];
  /** Existing time track entries for this task */
  timeEntries?: TimeTrack[];
  currentUserId: string;
  /** Available milestones for client/qa_requests task creation */
  milestones?: Task[];
  /** Pre-set status when creating from a Kanban column */
  defaultStatus?: TaskStatus;
  /** Pre-set order when creating from a Kanban column */
  defaultOrder?: number;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started",  label: "Not Started" },
  { value: "in_progress",  label: "In Progress" },
  { value: "ready_for_qa", label: "Ready for QA" },
  { value: "done",         label: "Done" },
  { value: "blocked",      label: "Blocked" },
];

interface LocalTimeEntry {
  id?: string;
  date: string;
  startMin: number;
  endMin: number;
  isNew: boolean;
}

function computeSpent(startMin: number, endMin: number): number {
  const diff = endMin - startMin;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

const today = new Date().toISOString().split("T")[0];

export default function TaskModal({
  open,
  onClose,
  task,
  projectId,
  parentTaskId,
  type,
  level,
  profiles,
  timeEntries = [],
  currentUserId,
  milestones = [],
  defaultStatus,
  defaultOrder,
}: TaskModalProps) {
  const router = useRouter();
  const isEdit = !!task;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Task fields
  const [name, setName] = useState(task?.name ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "not_started");
  const [estimatedTime, setEstimatedTime] = useState(task?.estimated_time?.toString() ?? "");
  const [startEst, setStartEst] = useState(task?.start_date_estimated ?? "");
  const [endEst, setEndEst] = useState(task?.end_date_estimated ?? "");
  const [startReal, setStartReal] = useState(task?.start_date_real ?? "");
  const [endReal, setEndReal] = useState(task?.end_date_real ?? "");
  const [description, setDescription] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task?.task_assignees?.map((a) => a.user_id) ?? []
  );
  // Milestone picker for client/qa requests
  const showMilestonePicker = !isEdit && (type === "client_requests" || type === "qa_requests") && milestones.length > 0;
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    parentTaskId ?? milestones[0]?.id ?? ""
  );

  // Local time entries state
  const [entries, setEntries] = useState<LocalTimeEntry[]>(
    timeEntries.map((e) => ({
      id: e.id,
      date: e.start_date ?? today,
      startMin: e.start_time_min ?? 540,
      endMin: e.end_time_min ?? 1020,
      isNew: false,
    }))
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Comments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && isEdit && task) {
      getTaskComments(task.id).then(setComments);
    }
  }, [open, isEdit, task]);

  useEffect(() => {
    // Scroll to bottom when comments change
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { date: today, startMin: 540, endMin: 1020, isNew: true },
    ]);
  };

  const removeEntry = (idx: number) => {
    const entry = entries[idx];
    if (entry.id) setDeletedIds((prev) => [...prev, entry.id!]);
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, patch: Partial<LocalTimeEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const realTimeTotal = entries.reduce((sum, e) => sum + computeSpent(e.startMin, e.endMin), 0);

  const handleSave = () => {
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }

    startTransition(async () => {
      const taskPayload: TaskInput = {
        name: name.trim(),
        project_id: projectId,
        parent_task_id: showMilestonePicker ? (selectedMilestoneId || null) : (parentTaskId ?? null),
        type,
        level,
        status,
        estimated_time: estimatedTime ? parseFloat(estimatedTime) : null,
        start_date_estimated: startEst || null,
        end_date_estimated: endEst || null,
        start_date_real: startReal || null,
        end_date_real: endReal || null,
        order: task?.order ?? defaultOrder ?? null,
        assignee_ids: assigneeIds,
      };

      let taskId = task?.id;
      if (isEdit) {
        const res = await updateTask(task!.id, taskPayload);
        if (res.error) { setError(res.error); return; }
      } else {
        const res = await createTask(taskPayload);
        if (res.error) { setError(res.error); return; }
        taskId = res.id;
      }

      for (const id of deletedIds) {
        await deleteTimeEntry(id, projectId);
      }

      for (const entry of entries) {
        await upsertTimeEntry({
          id: entry.id,
          task_id: taskId!,
          project_id: projectId,
          start_date: entry.date,
          start_time_min: entry.startMin,
          end_time_min: entry.endMin,
          time_spent_h: computeSpent(entry.startMin, entry.endMin),
        });
      }

      router.refresh();
      onClose();
    });
  };

  const handleSendComment = async () => {
    const msg = commentText.trim();
    if (!msg || !task?.id) return;
    setIsSendingComment(true);
    setCommentText("");
    // Optimistic
    const optimistic: TaskComment = {
      id: `tmp-${Date.now()}`,
      task_id: task.id,
      project_id: projectId,
      owner_id: currentUserId,
      message: msg,
      created_at: new Date().toISOString(),
      profiles: null,
    };
    setComments((prev) => [...prev, optimistic]);
    await createTaskComment(task.id, projectId, msg);
    // Reload to get real data with profiles
    const refreshed = await getTaskComments(task.id);
    setComments(refreshed);
    setIsSendingComment(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Task" width="max-w-2xl">
      <div className="px-6 pb-2 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Task name"
          />
        </div>

        {/* Milestone picker for client/qa requests */}
        {showMilestonePicker && (
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Milestone</label>
            <select
              value={selectedMilestoneId}
              onChange={(e) => setSelectedMilestoneId(e.target.value)}
              className="input-field"
            >
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.name ?? "Untitled Milestone"}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status + Assignees */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="input-field">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Assignees</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-muted border border-border rounded-md min-h-[40px]">
              {profiles.map((p) => {
                const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "?";
                const selected = assigneeIds.includes(p.id);
                const initial = fullName[0]?.toUpperCase() ?? "?";
                return (
                  <button
                    key={p.id}
                    type="button"
                    title={fullName}
                    onClick={() => toggleAssignee(p.id)}
                    className={`w-7 h-7 rounded-full text-[11px] font-semibold flex items-center justify-center overflow-hidden border-2 transition-all ${
                      selected ? "border-accent" : "border-transparent opacity-40"
                    }`}
                    style={{ background: "#3b82f6" }}
                  >
                    {p.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.picture} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white">{initial}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Est. time + Real time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Estimated Time (h)</label>
            <input type="number" min="0" step="0.5" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className="input-field" placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Real Time (h)</label>
            <input type="text" readOnly value={realTimeTotal.toFixed(2)} className="input-field bg-base cursor-default text-text-muted" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Start Date (Estimated)</label>
            <DatePicker value={startEst} onChange={setStartEst} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">End Date (Estimated)</label>
            <DatePicker value={endEst} onChange={setEndEst} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Start Date (Real)</label>
            <DatePicker value={startReal} onChange={setStartReal} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">End Date (Real)</label>
            <DatePicker value={endReal} onChange={setEndReal} />
          </div>
        </div>

        {/* Time Tracker */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Time Tracker</p>
          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_110px_110px_90px_40px_32px] gap-2 px-3 py-2 bg-muted text-xs font-semibold text-text-secondary">
              <span>Date</span>
              <span>Start Time</span>
              <span>End Time</span>
              <span>Time Spent (h)</span>
              <span>Owner</span>
              <span />
            </div>

            {entries.map((entry, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_110px_110px_90px_40px_32px] gap-2 px-3 py-2 border-t border-border items-center">
                <DatePicker
                  value={entry.date}
                  onChange={(v) => updateEntry(idx, { date: v })}
                  size="compact"
                />
                <select
                  value={minToTimeStr(entry.startMin)}
                  onChange={(e) => updateEntry(idx, { startMin: timeStrToMin(e.target.value) })}
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={minToTimeStr(entry.endMin)}
                  onChange={(e) => updateEntry(idx, { endMin: timeStrToMin(e.target.value) })}
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs text-text-secondary px-1">
                  {computeSpent(entry.startMin, entry.endMin).toFixed(2)}
                </span>
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-semibold">
                  Me
                </div>
                <button onClick={() => removeEntry(idx)} className="p-1 text-text-muted hover:text-red-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="border-t border-border">
              <button
                onClick={addEntry}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="Task description…"
          />
        </div>

        {/* Comments */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Comments</p>
          {!isEdit ? (
            <div className="flex flex-col items-center justify-center py-6 text-text-muted rounded-md border border-border bg-muted/30">
              <p className="text-xs">Save the task first to add comments.</p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden flex flex-col">
              {/* Message list */}
              <div className="flex flex-col gap-3 p-3 max-h-[220px] overflow-y-auto bg-muted/20">
                {comments.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-4">No comments yet.</p>
                )}
                {comments.map((c) => {
                  const isMine = c.owner_id === currentUserId;
                  const p = c.profiles;
                  const name = p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "?" : "?";
                  const initial = name[0]?.toUpperCase() ?? "?";
                  const time = new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={c.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Avatar */}
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[9px] font-semibold shrink-0 overflow-hidden">
                        {p?.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.picture} alt={name} className="w-full h-full object-cover" />
                        ) : initial}
                      </div>
                      {/* Bubble */}
                      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                        {!isMine && (
                          <span className="text-[10px] text-text-muted px-1">{name}</span>
                        )}
                        <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          isMine
                            ? "bg-accent text-white rounded-br-sm"
                            : "bg-muted text-text-primary rounded-bl-sm"
                        }`}>
                          {c.message}
                        </div>
                        <span className="text-[10px] text-text-muted px-1">{time}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                  placeholder="Type here..."
                  className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
                  disabled={isSendingComment}
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || isSendingComment}
                  className="p-1.5 rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
        <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
          Close
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}
