/**
 * Step 1 — Ideas Grid.
 * Displays all user ideas as cards with a project filter sidebar,
 * header with user name and create button.
 */
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Idea, ProjectOption } from "@/types/sandbox-planner";
import type { UserAiSettingsClient } from "@/types/settings";
import { cn } from "@/lib/utils";
import CreateIdeaModal from "./CreateIdeaModal";
import AiSettingsModal from "./AiSettingsModal";

interface IdeasGridProps {
  ideas: Idea[];
  projects: ProjectOption[];
  userName: string;
  onSelectIdea: (ideaId: string) => void;
  /** Current project filter from URL ?project= param. null = show all. */
  selectedProjectId: string | null;
  /** Whether the user has a configured AI service with a valid key. */
  hasAiConfigured: boolean;
  /** Masked AI settings for the settings modal form. */
  aiSettings: UserAiSettingsClient;
}

/** Renders the ideas overview: project filter, header, and card grid. */
export default function IdeasGrid({
  ideas,
  projects,
  userName,
  onSelectIdea,
  selectedProjectId,
  hasAiConfigured,
  aiSettings,
}: IdeasGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [pendingIdeaId, setPendingIdeaId] = useState<string | null>(null);

  /** Gate "See Refinement" — show AI settings modal if not configured. */
  function handleSelectIdea(ideaId: string) {
    if (!hasAiConfigured) {
      setPendingIdeaId(ideaId);
      setAiModalOpen(true);
      return;
    }
    onSelectIdea(ideaId);
  }

  /** After AI settings are saved, proceed to the pending idea. */
  function handleAiConfigured() {
    setAiModalOpen(false);
    if (pendingIdeaId) {
      onSelectIdea(pendingIdeaId);
      setPendingIdeaId(null);
    }
    router.refresh();
  }

  // Filter ideas by selected project
  const filteredIdeas = useMemo(() => {
    if (!selectedProjectId) return ideas;
    if (selectedProjectId === "general")
      return ideas.filter((i) => !i.project_id);
    return ideas.filter((i) => i.project_id === selectedProjectId);
  }, [ideas, selectedProjectId]);

  /** Update the project URL param. */
  function handleProjectSelect(projectId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) {
      params.set("project", projectId);
    } else {
      params.delete("project");
    }
    // Clear idea/tab params when changing project filter
    params.delete("idea");
    params.delete("tab");
    const qs = params.toString();
    router.push(`/sandbox-planner${qs ? `?${qs}` : ""}`);
  }

  // Determine defaultProjectId for the Create Idea modal
  const defaultProjectId =
    selectedProjectId && selectedProjectId !== "general"
      ? selectedProjectId
      : undefined;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Project filter sidebar */}
      <aside className="w-48 shrink-0 border-r border-border overflow-y-auto py-4">
        <h3 className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Projects
        </h3>
        <button
          onClick={() => handleProjectSelect("general")}
          className={cn(
            "w-full text-left px-4 py-1.5 text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
            selectedProjectId === "general" || !selectedProjectId
              ? "bg-accent text-white font-medium"
              : "text-text-secondary hover:text-text-primary hover:bg-muted"
          )}
        >
          General Ideas
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => handleProjectSelect(p.id)}
            className={cn(
              "w-full text-left px-4 py-1.5 text-sm truncate transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
              selectedProjectId === p.id
                ? "bg-accent text-white font-medium"
                : "text-text-secondary hover:text-text-primary hover:bg-muted"
            )}
          >
            {p.name ?? "Untitled"}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h1 className="text-xl font-bold text-text-primary">
            SandBox Planner
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">{userName}</span>
            <button
              onClick={() => setModalOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-accent text-white hover:bg-accent/90 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Idea
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredIdeas.length === 0 ? (
            <EmptyState onCreateClick={() => setModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onSelect={() => handleSelectIdea(idea.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Idea Modal */}
      <CreateIdeaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projects={projects}
        defaultProjectId={defaultProjectId}
      />

      {/* AI Settings Modal — shown when user needs to configure AI before refinement */}
      <AiSettingsModal
        open={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false);
          setPendingIdeaId(null);
        }}
        initialSettings={aiSettings}
        onConfigured={handleAiConfigured}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface IdeaCardProps {
  idea: Idea;
  onSelect: () => void;
}

/** Single idea card displaying name, description, and a refinement action. */
function IdeaCard({ idea, onSelect }: IdeaCardProps) {
  return (
    <div className="flex flex-col bg-surface border border-border rounded-xl p-5 transition-shadow hover:shadow-md">
      <h3 className="text-sm font-semibold text-text-primary line-clamp-2 mb-2">
        {idea.name}
      </h3>
      <p className="text-xs text-text-muted line-clamp-3 flex-1 mb-4">
        {idea.description ?? "No description yet."}
      </p>
      <button
        onClick={onSelect}
        className={cn(
          "self-start px-4 py-2 rounded-lg text-xs font-medium",
          "bg-accent text-white hover:bg-accent/90 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        )}
      >
        See Refinement
      </button>
    </div>
  );
}

/** Empty state shown when no ideas match the current filter. */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <svg
        className="w-12 h-12 text-text-muted/40 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
      <p className="text-sm text-text-muted mb-4">
        No ideas yet. Start by creating one.
      </p>
      <button
        onClick={onCreateClick}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          "bg-accent text-white hover:bg-accent/90 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        )}
      >
        Create New Idea
      </button>
    </div>
  );
}
