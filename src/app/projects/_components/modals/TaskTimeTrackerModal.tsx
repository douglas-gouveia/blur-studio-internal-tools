"use client";

import { useState, useEffect, useTransition } from "react";
import Modal from "./Modal";
import type { TimeTrack } from "@/types/projects";
import { TIME_OPTIONS, minToTimeStr, timeStrToMin } from "@/types/projects";
import { getTaskTimeEntries, upsertTimeEntry, deleteTimeEntry } from "../../actions";

interface TaskTimeTrackerModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  projectId: string;
  taskName: string;
}

interface LocalEntry {
  id?: string;
  date: string;
  startMin: number;
  endMin: number;
  profiles?: TimeTrack["profiles"];
  isNew: boolean;
}

function computeSpent(startMin: number, endMin: number): number {
  const diff = endMin - startMin;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

const todayStr = new Date().toISOString().split("T")[0];

export default function TaskTimeTrackerModal({
  open, onClose, taskId, projectId, taskName,
}: TaskTimeTrackerModalProps) {
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDeletedIds([]);
    getTaskTimeEntries(taskId).then((data) => {
      setEntries(
        data.map((e) => ({
          id: e.id,
          date: e.start_date ?? todayStr,
          startMin: e.start_time_min ?? 540,
          endMin: e.end_time_min ?? 1020,
          profiles: e.profiles,
          isNew: false,
        }))
      );
      setLoading(false);
    });
  }, [open, taskId]);

  const addEntry = () => {
    setEntries((prev) => [...prev, { date: todayStr, startMin: 540, endMin: 1020, isNew: true }]);
  };

  const removeEntry = (idx: number) => {
    const entry = entries[idx];
    if (entry.id) setDeletedIds((prev) => [...prev, entry.id!]);
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, patch: Partial<LocalEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const handleSave = () => {
    startTransition(async () => {
      for (const id of deletedIds) {
        await deleteTimeEntry(id);
      }
      for (const entry of entries) {
        await upsertTimeEntry({
          id: entry.id,
          task_id: taskId,
          project_id: projectId,
          start_date: entry.date,
          start_time_min: entry.startMin,
          end_time_min: entry.endMin,
          time_spent_h: computeSpent(entry.startMin, entry.endMin),
        });
      }
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Task" width="max-w-2xl">
      <div className="px-6 pb-4 space-y-4">
        <p className="text-sm font-medium text-text-secondary">{taskName}</p>

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">Time Tracker</p>

          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_110px_110px_90px_36px_32px] gap-2 px-3 py-2 bg-muted text-xs font-semibold text-text-secondary">
              <span>Date</span>
              <span>Start Time</span>
              <span>End Time</span>
              <span>Time Spent (h)</span>
              <span>Owner</span>
              <span />
            </div>

            {loading && (
              <div className="px-3 py-4 text-xs text-text-muted text-center">Loading…</div>
            )}

            {!loading && entries.map((entry, idx) => {
              const p = entry.profiles;
              const initials = ((p?.first_name?.[0] ?? "") + (p?.last_name?.[0] ?? "")).toUpperCase() || "?";
              return (
                <div key={idx} className="grid grid-cols-[1fr_110px_110px_90px_36px_32px] gap-2 px-3 py-2 border-t border-border items-center">
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
                  <div
                    className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden"
                    title={[p?.first_name, p?.last_name].filter(Boolean).join(" ") || ""}
                  >
                    {p?.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.picture} alt={initials} className="w-full h-full object-cover" />
                    ) : initials}
                  </div>
                  <button onClick={() => removeEntry(idx)} className="p-1 text-text-muted hover:text-red-400 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}

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
      </div>

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
