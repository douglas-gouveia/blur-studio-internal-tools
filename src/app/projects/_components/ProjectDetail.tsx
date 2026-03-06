"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Project, Task, UserType, TabKey, UserProfile } from "@/types/projects";
import { getVisibleTabs, TAB_LABELS, getScheduleProgressBadge } from "@/types/projects";
import StagesChecking from "./tabs/StagesChecking";
import DeveloperTasks from "./tabs/DeveloperTasks";
import TasksKanban from "./tabs/TasksKanban";
import WorkingHoursModal from "./modals/WorkingHoursModal";
import QATimeTrackerModal from "./modals/QATimeTrackerModal";

interface ProjectDetailProps {
  project: Project;
  tasks: Task[];
  userType: UserType | null;
  initialTab: TabKey;
  profiles: UserProfile[];
  currentUserId: string;
}

const PROGRESS_COLORS: Record<"green" | "yellow" | "red", string> = {
  green:  "bg-[#14532d] text-[#86efac]",
  yellow: "bg-[#422006] text-[#fde68a]",
  red:    "bg-[#7f1d1d] text-[#fca5a5]",
};

export default function ProjectDetail({ project, tasks, userType, initialTab, profiles, currentUserId }: ProjectDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visibleTabs = getVisibleTabs(userType);
  const defaultTab = visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0];
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);
  const [qaTrackerOpen, setQaTrackerOpen] = useState(false);

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/projects?${params.toString()}`, { scroll: false });
  }

  const totalEst = tasks.reduce((sum, t) => sum + (t.estimated_time ?? 0), 0);
  const doneOrQaEst = tasks
    .filter((t) => t.status === "done" || t.status === "ready_for_qa")
    .reduce((sum, t) => sum + (t.estimated_time ?? 0), 0);
  const progress = getScheduleProgressBadge(project, { totalEst, doneOrQaEst });
  const milestones = tasks.filter((t) => t.type === "developer_tasks" && t.level === "level_1" && !t.parent_task_id);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-text-muted">
            <Link href="/projects" className="hover:text-text-secondary transition-colors">
              Projects
            </Link>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-text-primary font-medium truncate max-w-[240px]">
              {project.name ?? "Untitled"}
            </span>
          </nav>

          {/* Progress badge */}
          <span className={`status-badge text-[10px] ${PROGRESS_COLORS[progress.color]}`}>
            {progress.label}
          </span>
        </div>

        {/* Working hours button */}
        <button
          onClick={() => setWorkingHoursOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          See Working Hours
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-end gap-0 px-6 border-b border-border">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "stages" && (
          <StagesChecking
            tasks={tasks}
            projectStage={project.stage}
          />
        )}
        {activeTab === "developer" && (
          <DeveloperTasks
            tasks={tasks}
            userType={userType}
            projectId={project.id}
            profiles={profiles}
            currentUserId={currentUserId}
          />
        )}
        {activeTab === "client_requests" && (
          <TasksKanban
            tasks={tasks}
            userType={userType}
            projectId={project.id}
            type="client_requests"
            profiles={profiles}
            currentUserId={currentUserId}
          />
        )}
        {activeTab === "qa_requests" && (
          <TasksKanban
            tasks={tasks}
            userType={userType}
            projectId={project.id}
            type="qa_requests"
            profiles={profiles}
            currentUserId={currentUserId}
            onTrackQATime={() => setQaTrackerOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <WorkingHoursModal
        open={workingHoursOpen}
        onClose={() => setWorkingHoursOpen(false)}
        projectId={project.id}
        projectName={project.name ?? "Untitled"}
      />
      <QATimeTrackerModal
        open={qaTrackerOpen}
        onClose={() => setQaTrackerOpen(false)}
        projectId={project.id}
        milestones={milestones}
      />
    </div>
  );
}
