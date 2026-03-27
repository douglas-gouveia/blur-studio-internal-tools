/**
 * Step 3 — Refining ICPs.
 * Shows ICP pills at top, with per-ICP editable fields for
 * "Day in the Life" and "Pain Points & Acute Needs".
 * Left column shows readonly idea context, right column shows editable ICP fields.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/sandbox-planner";
import { saveIcpProfile, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import IcpPillSelector from "./IcpPillSelector";
import AiLoadingOverlay from "./AiLoadingOverlay";

interface RefiningIcpStepProps {
  ideaFull: IdeaFull;
}

/** Renders the Refining ICP step with per-persona editing and AI regeneration. */
export default function RefiningIcpStep({ ideaFull }: RefiningIcpStepProps) {
  const { idea, structureAlign, icps } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "refining_icp";

  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(
    icps[0]?.id ?? null
  );
  const [dayInLife, setDayInLife] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIcp = icps.find((i) => i.id === selectedIcpId) ?? null;

  // Sync fields when selected ICP changes
  useEffect(() => {
    if (selectedIcp) {
      setDayInLife(selectedIcp.day_in_life ?? "");
      setPainPoints(selectedIcp.pain_points ?? "");
    } else {
      setDayInLife("");
      setPainPoints("");
    }
  }, [selectedIcp]);

  async function handleSave() {
    if (!selectedIcpId || isSaving) return;
    setIsSaving(true);
    setError(null);

    const result = await saveIcpProfile(selectedIcpId, {
      day_in_life: dayInLife.trim(),
      pain_points: painPoints.trim(),
    });

    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);

    const result = await triggerAiGeneration(
      idea.id,
      "refining_icp",
      selectedIcpId ?? undefined
    );

    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  if (isAiWorking) {
    return <AiLoadingOverlay step="refining_icp" />;
  }

  if (icps.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          No ICPs have been generated yet. Run AI on the Structure &amp; Align step first,
          then regenerate ICPs here.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-accent text-white hover:bg-accent/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:opacity-50"
          )}
        >
          {isRegenerating ? "Generating..." : "Generate ICPs"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ICP pills */}
      <IcpPillSelector
        icps={icps}
        selectedId={selectedIcpId}
        onSelect={setSelectedIcpId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Readonly context */}
        <div className="space-y-4">
          {/* Original Idea */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Original Idea*
            </h3>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {idea.description ?? "No description provided."}
              </p>
            </div>
          </div>

          {/* Finalized Core Problem */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Finalized Core Problem*
            </h3>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {structureAlign?.core_problem ?? "Not defined yet. Complete the Structure & Align step first."}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Instructions
            </h3>
            <p className="text-xs text-text-muted mb-2">
              This step is about humanizing your target audience. We need to move
              beyond demographics and understand their daily reality.
            </p>
            <p className="text-xs text-text-muted mb-1">
              Ensure the product solves a <strong>real, urgent need</strong>, not
              just a minor inconvenience.
            </p>
            <ul className="text-xs text-text-muted list-disc list-inside space-y-0.5">
              <li>Identify specific friction points.</li>
              <li>Validate willingness to pay.</li>
            </ul>
          </div>
        </div>

        {/* Right column — Editable fields */}
        <div className="space-y-5">
          {/* Day in the Life */}
          <div>
            <label
              htmlFor="day-in-life"
              className="block text-sm font-semibold text-text-primary mb-1.5"
            >
              Day in the Life (ROLES &amp; CONTEXT)*
            </label>
            <textarea
              id="day-in-life"
              value={dayInLife}
              onChange={(e) => setDayInLife(e.target.value)}
              rows={8}
              disabled={isSaving || isRegenerating || !selectedIcp}
              placeholder="Describe the daily reality, roles, and context for this persona..."
              className={cn(
                "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted resize-none",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                "disabled:opacity-50"
              )}
            />
          </div>

          {/* Pain Points & Acute Needs */}
          <div>
            <label
              htmlFor="pain-points"
              className="block text-sm font-semibold text-text-primary mb-1.5"
            >
              Pain Points &amp; Acute Needs (FRICTION &amp; IMPACT)*
            </label>
            <textarea
              id="pain-points"
              value={painPoints}
              onChange={(e) => setPainPoints(e.target.value)}
              rows={8}
              disabled={isSaving || isRegenerating || !selectedIcp}
              placeholder="Describe key pain points, friction, and urgent needs..."
              className={cn(
                "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted resize-none",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                "disabled:opacity-50"
              )}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating || isSaving}
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
            <button
              onClick={handleSave}
              disabled={!selectedIcpId || isSaving || isRegenerating}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                "bg-green-600 text-white hover:bg-green-700 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
