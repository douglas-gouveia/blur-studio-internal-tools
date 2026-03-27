/**
 * Step 5 — Strategic Frameworks.
 * Displays per-ICP framework cards: Value Proposition, JTBD Synthesis,
 * ICP Architect, NABC Pitch, and Optimization Suggestions.
 * Uses IcpPillSelector with completion badges.
 */
"use client";

import { useState, useMemo } from "react";
import type { IdeaFull, IdeaIcp, IdeaOptimizationSuggestion } from "@/types/sandbox-planner";
import { triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import IcpPillSelector from "./IcpPillSelector";
import AiLoadingOverlay from "./AiLoadingOverlay";

/** Fields that count toward "completion" for an ICP's strategic frameworks. */
const FRAMEWORK_FIELDS: (keyof IdeaIcp)[] = [
  "value_proposition_icp_pains",
  "value_proposition_icp_gains",
  "jtbd",
  "title",
  "pitch_need",
  "pitch_approach",
  "pitch_benefit",
  "pitch_competition",
];

interface StrategicFrameworksStepProps {
  ideaFull: IdeaFull;
}

/** Renders the Strategic Frameworks step with per-ICP framework cards and AI regeneration. */
export default function StrategicFrameworksStep({ ideaFull }: StrategicFrameworksStepProps) {
  const { idea, icps, optimizationSuggestions } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "strategic_frameworks";

  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(
    icps[0]?.id ?? null
  );
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIcp = icps.find((i) => i.id === selectedIcpId) ?? null;

  // Completion badges: count filled framework fields per ICP
  const completionBadges = useMemo(() => {
    const badges: Record<string, string> = {};
    for (const icp of icps) {
      const filled = FRAMEWORK_FIELDS.filter(
        (f) => icp[f] != null && String(icp[f]).trim() !== ""
      ).length;
      badges[icp.id] = `${filled}/${FRAMEWORK_FIELDS.length}`;
    }
    return badges;
  }, [icps]);

  // Filter optimization suggestions for selected ICP
  const icpSuggestions = useMemo(
    () =>
      selectedIcpId
        ? optimizationSuggestions.filter((s) => s.icp_id === selectedIcpId)
        : [],
    [optimizationSuggestions, selectedIcpId]
  );

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);

    const result = await triggerAiGeneration(
      idea.id,
      "strategic_frameworks",
      selectedIcpId ?? undefined
    );

    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  if (isAiWorking) {
    return <AiLoadingOverlay step="strategic_frameworks" />;
  }

  if (icps.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No ICPs available. Complete the Refining ICP step first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* ICP pills with completion badges */}
      <IcpPillSelector
        icps={icps}
        selectedId={selectedIcpId}
        onSelect={setSelectedIcpId}
        completionBadges={completionBadges}
      />

      {selectedIcp && (
        <div className="space-y-6">
          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FrameworkCard
              title="Value Proposition"
              icon="VP"
              sections={[
                { label: "ICP Pains", content: selectedIcp.value_proposition_icp_pains },
                { label: "ICP Gains", content: selectedIcp.value_proposition_icp_gains },
              ]}
            />

            {/* JTBD Synthesis */}
            <FrameworkCard
              title="JTBD Synthesis"
              icon="JT"
              sections={[{ label: null, content: selectedIcp.jtbd }]}
            />
          </div>

          {/* ICP Architect + NABC Pitch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IcpArchitectCard icp={selectedIcp} />
            <NabcPitchCard icp={selectedIcp} />
          </div>

          {/* Optimization Suggestions */}
          {icpSuggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Optimization Suggestions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {icpSuggestions.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Regenerate button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-accent text-white hover:bg-accent/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRegenerating
            ? "Regenerating..."
            : `Regenerate for ICP ${selectedIcp?.name ?? ""}`}
        </button>
      </div>
    </div>
  );
}

// ── Card Components ──────────────────────────────────────────────────────────

interface FrameworkSection {
  label: string | null;
  content: string | null;
}

interface FrameworkCardProps {
  title: string;
  icon: string;
  sections: FrameworkSection[];
}

/** Generic framework card with a title badge and content sections. */
function FrameworkCard({ title, icon, sections }: FrameworkCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i}>
            {s.label && (
              <p className="text-xs font-medium text-text-muted mb-1">
                {s.label}
              </p>
            )}
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {s.content || "Not generated yet."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ICP Architect card showing the persona profile with tags. */
function IcpArchitectCard({ icp }: { icp: IdeaIcp }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
          IA
        </span>
        <h3 className="text-sm font-semibold text-text-primary">
          ICP Architect
        </h3>
      </div>

      <div className="space-y-3">
        {/* Profile header */}
        <div className="flex items-center gap-3">
          {icp.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icp.picture}
              alt={icp.name ?? "ICP"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-text-muted text-xs font-bold">
              {(icp.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-text-primary">
              {icp.title ?? icp.name ?? "Unnamed"}
            </p>
            {icp.subtitle && (
              <p className="text-xs text-text-muted">{icp.subtitle}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {icp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {icp.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-muted text-text-muted text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Psychographics & Firmographics */}
        {icp.psychographics && (
          <div>
            <p className="text-xs font-medium text-text-muted mb-1">
              Psychographics
            </p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {icp.psychographics}
            </p>
          </div>
        )}
        {icp.firmographics && (
          <div>
            <p className="text-xs font-medium text-text-muted mb-1">
              Firmographics
            </p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {icp.firmographics}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** NABC Pitch card with Need, Approach, Benefit, Competition sections. */
function NabcPitchCard({ icp }: { icp: IdeaIcp }) {
  return (
    <FrameworkCard
      title="NABC Pitch"
      icon="NP"
      sections={[
        { label: "Need", content: icp.pitch_need },
        { label: "Approach", content: icp.pitch_approach },
        { label: "Benefit", content: icp.pitch_benefit },
        { label: "Competition", content: icp.pitch_competition },
      ]}
    />
  );
}

/** Optimization suggestion card. */
function SuggestionCard({ suggestion }: { suggestion: IdeaOptimizationSuggestion }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h4 className="text-sm font-semibold text-text-primary mb-1">
        {suggestion.name ?? "Suggestion"}
      </h4>
      <p className="text-xs text-text-secondary whitespace-pre-wrap">
        {suggestion.description ?? "No description."}
      </p>
    </div>
  );
}
