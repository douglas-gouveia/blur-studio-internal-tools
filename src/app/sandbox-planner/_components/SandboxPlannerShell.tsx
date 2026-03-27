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

/** Derive which steps are unlocked based on saved data in ideaFull. */
function computeUnlockedSteps(ideaFull: IdeaFull): Set<IdeaBlock> {
  const unlocked = new Set<IdeaBlock>(["ideas", "structure_align"]);
  const { structureAlign, icps, productDefinition } = ideaFull;

  const structureDone =
    !!structureAlign?.core_problem?.trim() &&
    !!structureAlign?.target_audience?.trim() &&
    !!structureAlign?.success_metrics?.trim();

  if (structureDone) unlocked.add("refining_icp");

  const icpsDone =
    icps.length > 0 &&
    icps.every((i) => i.day_in_life?.trim() && i.pain_points?.trim());

  if (icpsDone) unlocked.add("product_definition_flows");

  const productDone =
    !!productDefinition?.summary?.trim() &&
    !!productDefinition?.features?.trim();

  if (productDone) unlocked.add("strategic_frameworks");

  return unlocked;
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

  const unlockedSteps = ideaFull ? computeUnlockedSteps(ideaFull) : new Set<IdeaBlock>(["ideas"]);

  // Sync tab from URL; if the tab is locked, navigate to the last unlocked step
  useEffect(() => {
    const tab = searchParams.get("tab") as IdeaBlock | null;
    if (tab && IDEA_BLOCKS_ORDERED.includes(tab)) {
      if (ideaFull && !unlockedSteps.has(tab)) {
        // Find the last unlocked step
        const lastUnlocked = IDEA_BLOCKS_ORDERED.filter((b) => unlockedSteps.has(b)).at(-1);
        if (lastUnlocked) navigateTab(lastUnlocked);
      } else {
        setActiveTab(tab);
      }
    } else if (!searchParams.get("idea")) {
      setActiveTab("ideas");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Idea selected — show breadcrumb navigation + step content
  const stepInfo = IDEA_BLOCK_STEPS[activeTab];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumb tab navigation */}
      <div className="shrink-0 border-b border-border bg-surface px-6 pt-4 pb-0">
        <div className="inline-flex items-center gap-1 bg-surface/80 rounded-full px-3 py-1.5 border border-border mb-4">
          {IDEA_BLOCKS_ORDERED.map((block, index) => {
            const isActive = activeTab === block;
            const isUnlocked = unlockedSteps.has(block);
            const isLast = index === IDEA_BLOCKS_ORDERED.length - 1;

            return (
              <span key={block} className="flex items-center gap-1">
                <button
                  onClick={() => isUnlocked && navigateTab(block)}
                  disabled={!isUnlocked}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                    isActive
                      ? "bg-white text-gray-900 font-semibold shadow-sm"
                      : isUnlocked
                      ? "text-text-secondary hover:text-text-primary cursor-pointer"
                      : "text-text-muted opacity-40 cursor-not-allowed"
                  )}
                >
                  {IDEA_BLOCK_LABELS[block]}
                </button>
                {!isLast && (
                  <span className="text-text-muted text-xs select-none">›</span>
                )}
              </span>
            );
          })}
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
