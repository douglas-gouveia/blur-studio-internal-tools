"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, UserType, UserProfile } from "@/types/projects";
import { getProgressBadge } from "@/types/projects";
import ProjectModal from "./modals/ProjectModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import { deleteProject } from "../actions";

interface ProjectsListProps {
  projects: Project[];
  userType: UserType | null;
  profiles: UserProfile[];
}

const STATUS_LABELS: Record<Project["status"], string> = {
  prospecting:  "Prospecting",
  not_started:  "Not Started",
  in_progress:  "In Progress",
  done:         "Done",
  blocked:      "Blocked",
  archived:     "Archived",
  lost_deal:    "Lost Deal",
};

const STATUS_COLORS: Record<Project["status"], string> = {
  prospecting:  "bg-[#1c3557] text-[#93c5fd]",
  not_started:  "bg-[#27272a] text-[#a1a1aa]",
  in_progress:  "bg-[#1d3f7a] text-[#93c5fd]",
  done:         "bg-[#14532d] text-[#86efac]",
  blocked:      "bg-[#7f1d1d] text-[#fca5a5]",
  archived:     "bg-[#374151] text-[#9ca3af]",
  lost_deal:    "bg-[#3b0764] text-[#d8b4fe]",
};

const PROGRESS_COLORS: Record<"green" | "yellow" | "red", string> = {
  green:  "bg-[#14532d] text-[#86efac]",
  yellow: "bg-[#422006] text-[#fde68a]",
  red:    "bg-[#7f1d1d] text-[#fca5a5]",
};

export default function ProjectsList({ projects, userType, profiles }: ProjectsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [projectModal, setProjectModal] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });

  const canEdit = userType === "admin" || userType === "manager";

  const filtered = projects.filter((p) => {
    const matchSearch = !search || (p.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {canEdit && (
          <button
            onClick={() => setProjectModal({ open: true, project: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_140px_110px_110px_90px_90px_130px_80px_64px] gap-2 px-4 py-2 bg-elevated text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border">
          <span>#</span>
          <span>Name</span>
          <span>Status</span>
          <span>Start Date</span>
          <span>End Date</span>
          <span>Est. (h)</span>
          <span>Real (h)</span>
          <span>Progress</span>
          <span>Users</span>
          {canEdit && <span />}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <p className="text-sm">No projects found.</p>
          </div>
        )}

        {filtered.map((project, idx) => {
          const progress = getProgressBadge(project.real_time, project.estimated_time);
          return (
            <div
              key={project.id}
              className="grid grid-cols-[40px_1fr_140px_110px_110px_90px_90px_130px_80px_64px] gap-2 px-4 py-3 border-b border-border/50 items-center hover:bg-muted/30 transition-colors group"
            >
              <span className="text-xs text-text-muted">{idx + 1}</span>

              <div className="flex items-center gap-2.5 min-w-0">
                {project.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.picture} alt={project.name ?? ""} className="w-7 h-7 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                    {(project.name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/projects?project=${project.id}`}
                    className="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate block"
                  >
                    {project.name ?? "Untitled"}
                  </Link>
                  {project.description && (
                    <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              <span className={`status-badge text-[10px] ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
              <DateCell value={project.start_date_real} />
              <DateCell value={project.end_date_real} />
              <NumCell value={project.estimated_time} />
              <NumCell value={project.real_time} />
              <span className={`status-badge text-[10px] ${PROGRESS_COLORS[progress.color]}`}>
                {progress.label}
              </span>
              <span className="text-xs text-text-secondary">{project.authorized_users.length}</span>

              {canEdit && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setProjectModal({ open: true, project })}
                    className="p-1 text-text-muted hover:text-text-primary transition-colors"
                    title="Edit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, project })}
                    className="p-1 text-text-muted hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModal.open}
        onClose={() => setProjectModal({ open: false, project: null })}
        project={projectModal.project}
        profiles={profiles}
      />
      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, project: null })}
        kind="project"
        itemName={deleteModal.project?.name ?? ""}
        onConfirm={() => deleteProject(deleteModal.project!.id)}
      />
    </div>
  );
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
