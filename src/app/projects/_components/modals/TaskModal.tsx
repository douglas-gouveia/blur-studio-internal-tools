"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import type {
  Task,
  TaskStatus,
  TaskType,
  TaskLevel,
  TimeTrack,
  UserProfile,
} from "@/types/projects";
import { TIME_OPTIONS, minToTimeStr, timeStrToMin } from "@/types/projects";
import {
  createTask,
  updateTask,
  upsertTimeEntry,
  deleteTimeEntry,
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
}: TaskModalProps) {
  const router = useRouter();
  const isEdit = !!task;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Task fields
  const [name, setName] = useState(task?.name ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "not_started");
  const [estimatedTime, setEstimatedTime] = useState(task?.estimated_time?.toString() ?? "");
  const [startEst, setStartEst] = useState(task?.start_date_estimated ?? "");
  const [endEst, setEndEst] = useState(task?.end_date_estimated ?? "");
  const [startReal, setStartReal] = useState(task?.start_date_real ?? "");
  const [endReal, setEndReal] = useState(task?.end_date_real ?? "");
  const [description, setDescription] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task?.task_assignees?.map((a) => a.user_id) ?? []
  );

  // Local time entries state (from DB entries initially)
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
      // 1. Upsert the task
      const taskPayload: TaskInput = {
        name: name.trim(),
        project_id: projectId,
        parent_task_id: parentTaskId ?? null,
        type,
        level,
        status,
        estimated_time: estimatedTime ? parseFloat(estimatedTime) : null,
        start_date_estimated: startEst || null,
        end_date_estimated: endEst || null,
        start_date_real: startReal || null,
        end_date_real: endReal || null,
        order: task?.order ?? null,
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

      // 2. Delete removed entries
      for (const id of deletedIds) {
        await deleteTimeEntry(id);
      }

      // 3. Upsert new/modified entries
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
            <input type="date" value={startEst} onChange={(e) => setStartEst(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">End Date (Estimated)</label>
            <input type="date" value={endEst} onChange={(e) => setEndEst(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Start Date (Real)</label>
            <input type="date" value={startReal} onChange={(e) => setStartReal(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">End Date (Real)</label>
            <input type="date" value={endReal} onChange={(e) => setEndReal(e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Time Tracker */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Time Tracker</p>
          <div className="rounded-md border border-border overflow-hidden">
            {/* Header */}
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
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => updateEntry(idx, { date: e.target.value })}
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
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
                {/* Owner avatar (current user placeholder) */}
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

            {/* Add row */}
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
            rows={4}
            className="input-field resize-none"
            placeholder="Task description…"
          />
        </div>

        {/* Comments */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Comments</p>
          <div className="flex flex-col items-center justify-center py-8 text-text-muted rounded-md border border-border bg-muted/30">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-xs">No comments</p>
          </div>
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
