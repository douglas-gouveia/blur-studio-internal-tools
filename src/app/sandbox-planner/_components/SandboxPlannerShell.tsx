/**
 * Client shell for the Sandbox Planner.
 * Manages tab navigation, idea selection state, and renders the appropriate
 * step component based on the active tab.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Idea, IdeaBlock, IdeaFull, ProjectOption } from "@/types/sandbox-planner";
import type { UserAiSettingsClient } from "@/types/settings";
import { IDEA_BLOCK_LABELS, IDEA_BLOCKS_ORDERED, IDEA_BLOCK_STEPS } from "@/types/sandbox-planner";
import { cn } from "@/lib/utils";
import IdeasGrid from "./IdeasGrid";
import StructureAlignStep from "./StructureAlignStep";
import RefiningIcpStep from "./RefiningIcpStep";
import ProductDefinitionStep from "./ProductDefinitionStep";
import StrategicFrameworksStep from "./StrategicFrameworksStep";

interface SandboxPlannerShellProps {
  ideas: Idea[];
  projects: ProjectOption[];
  ideaFull: IdeaFull | null;
  initialTab: IdeaBlock;
  userName: string;
  selectedProjectId: string | null;
  hasAiConfigured: boolean;
  aiSettings: UserAiSettingsClient;
}

/** Root client component that orchestrates all sandbox-planner views. */
export default function SandboxPlannerShell({
  ideas,
  projects,
  ideaFull,
  initialTab,
  userName,
  selectedProjectId,
  hasAiConfigured,
  aiSettings,
}: SandboxPlannerShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<IdeaBlock>(initialTab);

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab") as IdeaBlock | null;
    if (tab && IDEA_BLOCKS_ORDERED.includes(tab)) {
      setActiveTab(tab);
    } else if (!searchParams.get("idea")) {
      setActiveTab("ideas");
    }
  }, [searchParams]);

  // Subscribe to realtime idea updates for AI polling
  useEffect(() => {
    if (!ideaFull) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`idea-${ideaFull.idea.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "idea",
          filter: `id=eq.${ideaFull.idea.id}`,
        },
        (payload) => {
          const updated = payload.new as { current_blocks_updating: string | null };
          // When AI finishes (current_blocks_updating cleared), refresh data
          if (!updated.current_blocks_updating) {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ideaFull, router]);

  /** Navigate to a tab, preserving the selected idea and project in the URL. */
  const navigateTab = useCallback(
    (tab: IdeaBlock) => {
      const ideaId = searchParams.get("idea");
      const projectId = searchParams.get("project");
      const projectSuffix = projectId ? `&project=${projectId}` : "";
      if (tab === "ideas") {
        router.push(`/sandbox-planner${projectId ? `?project=${projectId}` : ""}`);
      } else if (ideaId) {
        router.push(`/sandbox-planner?idea=${ideaId}&tab=${tab}${projectSuffix}`);
      }
    },
    [router, searchParams]
  );

  /** Navigate to an idea's refinement view. */
  const selectIdea = useCallback(
    (ideaId: string) => {
      const projectId = searchParams.get("project");
      const projectSuffix = projectId ? `&project=${projectId}` : "";
      router.push(`/sandbox-planner?idea=${ideaId}&tab=structure_align${projectSuffix}`);
    },
    [router, searchParams]
  );

  // If no idea selected, show the ideas grid
  if (!ideaFull) {
    return (
      <IdeasGrid
        ideas={ideas}
        projects={projects}
        userName={userName}
        onSelectIdea={selectIdea}
        selectedProjectId={selectedProjectId}
        hasAiConfigured={hasAiConfigured}
        aiSettings={aiSettings}
      />
    );
  }

  // Idea selected — show tab navigation + step content
  const stepInfo = IDEA_BLOCK_STEPS[activeTab];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab navigation */}
      <div className="shrink-0 border-b border-border bg-surface">
        <div className="flex items-center gap-1 px-6 pt-4">
          {IDEA_BLOCKS_ORDERED.map((block) => (
            <button
              key={block}
              onClick={() => navigateTab(block)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                activeTab === block
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-muted"
              )}
            >
              {IDEA_BLOCK_LABELS[block]}
            </button>
          ))}
        </div>
      </div>

      {/* Step header */}
      <div className="shrink-0 px-6 pt-5 pb-4">
        <h1 className="text-xl font-bold text-text-primary">
          {IDEA_BLOCK_LABELS[activeTab]}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Step {stepInfo.step} of 5. {stepInfo.subtitle}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === "ideas" && (
          <IdeasGrid
            ideas={ideas}
            projects={projects}
            userName={userName}
            onSelectIdea={selectIdea}
            selectedProjectId={selectedProjectId}
            hasAiConfigured={hasAiConfigured}
            aiSettings={aiSettings}
          />
        )}
        {activeTab === "structure_align" && (
          <StructureAlignStep ideaFull={ideaFull} />
        )}
        {activeTab === "refining_icp" && (
          <RefiningIcpStep ideaFull={ideaFull} />
        )}
        {activeTab === "product_definition_flows" && (
          <ProductDefinitionStep ideaFull={ideaFull} />
        )}
        {activeTab === "strategic_frameworks" && (
          <StrategicFrameworksStep ideaFull={ideaFull} />
        )}
      </div>
    </div>
  );
}
