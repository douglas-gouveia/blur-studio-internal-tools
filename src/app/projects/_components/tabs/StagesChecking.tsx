"use client";

import type { Task, ProjectStage } from "@/types/projects";
import { STAGE_LABELS, STAGE_ORDER } from "@/types/projects";

interface StagesCheckingProps {
  tasks: Task[];
  projectStage: ProjectStage | null;
}

export default function StagesChecking({ tasks, projectStage }: StagesCheckingProps) {
  // Build a map from stage name → task (matched by task.name to stage label or stage key)
  const taskByStage = new Map<ProjectStage, Task>();
  tasks
    .filter((t) => t.type === "stages_checking")
    .forEach((t) => {
      // Match task name to stage key (case-insensitive)
      const stageKey = STAGE_ORDER.find(
        (s) => STAGE_LABELS[s].toLowerCase() === t.name?.toLowerCase()
      );
      if (stageKey) taskByStage.set(stageKey, t);
    });

  // Determine current stage index for coloring
  const currentStageIndex = projectStage ? STAGE_ORDER.indexOf(projectStage) : -1;

  return (
    <div className="flex flex-col gap-1">
      <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-widest">
        Name
      </div>

      {STAGE_ORDER.map((stage, idx) => {
        const task = taskByStage.get(stage);
        const status = task?.status ?? inferStatus(idx, currentStageIndex);
        return (
          <StageRow
            key={stage}
            label={STAGE_LABELS[stage]}
            status={status}
          />
        );
      })}
    </div>
  );
}

function inferStatus(
  idx: number,
  currentIdx: number
): "done" | "in_progress" | "not_started" {
  if (currentIdx === -1) return "not_started";
  if (idx < currentIdx) return "done";
  if (idx === currentIdx) return "in_progress";
  return "not_started";
}

function StageRow({
  label,
  status,
}: {
  label: string;
  status: "done" | "in_progress" | "not_started" | "ready_for_qa" | "blocked";
}) {
  const bg = {
    done: "bg-[#dcfce7]",
    in_progress: "bg-[#fef9c3]",
    ready_for_qa: "bg-[#dbeafe]",
    not_started: "bg-white",
    blocked: "bg-[#fee2e2]",
  }[status];

  const textColor = {
    done: "text-[#166534]",
    in_progress: "text-[#854d0e]",
    ready_for_qa: "text-[#1e40af]",
    not_started: "text-[#6b7280]",
    blocked: "text-[#991b1b]",
  }[status];

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 ${bg}`}
    >
      <span className={`text-sm font-medium ${textColor}`}>{label}</span>
      <StatusIcon status={status} />
    </div>
  );
}

function StatusIcon({
  status,
}: {
  status: "done" | "in_progress" | "not_started" | "ready_for_qa" | "blocked";
}) {
  if (status === "done") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-white text-xs">
        ●
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  // not_started / ready_for_qa
  return <span className="w-6 h-6 rounded-full border-2 border-gray-200" />;
}
