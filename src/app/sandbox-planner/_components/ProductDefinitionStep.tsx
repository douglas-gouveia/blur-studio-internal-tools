/**
 * Step 4 — Product Definition & Flows.
 * Left column: readonly idea context + product architecture notes.
 * Right column: rich text Product Summary editor, features display,
 * user type pills with per-type flow content.
 */
"use client";

import { useState } from "react";
import type { IdeaFull } from "@/types/sandbox-planner";
import { saveProductDefinition, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import RichTextEditor from "./RichTextEditor";
import AiLoadingOverlay from "./AiLoadingOverlay";

interface ProductDefinitionStepProps {
  ideaFull: IdeaFull;
}

/** Renders the Product Definition & Flows step with rich text editing and user type pills. */
export default function ProductDefinitionStep({ ideaFull }: ProductDefinitionStepProps) {
  const { idea, structureAlign, productDefinition, userTypes } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "product_definition_flows";

  const [summary, setSummary] = useState(productDefinition?.summary ?? "");
  const [features, setFeatures] = useState(productDefinition?.features ?? "");
  const [selectedUserType, setSelectedUserType] = useState<string | null>(
    userTypes[0]?.id ?? null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = userTypes.find((u) => u.id === selectedUserType) ?? null;

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    const result = await saveProductDefinition(idea.id, {
      summary: summary,
      features: features,
    });

    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);

    const result = await triggerAiGeneration(idea.id, "product_definition_flows");

    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  if (isAiWorking) {
    return <AiLoadingOverlay step="product_definition_flows" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Readonly context */}
        <div className="space-y-4">
          {/* Original Idea */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Original Idea*
            </h3>
            <div className="rounded-lg border border-border bg-surface p-4">
              <h4 className="text-sm font-bold text-text-primary mb-2">
                {idea.name}
              </h4>
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
                {structureAlign?.core_problem ?? "Not defined yet."}
              </p>
            </div>
          </div>

          {/* Product Architecture notes */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Product Architecture
            </h3>
            <p className="text-xs text-text-muted mb-2">
              Now that we know the problem, let&apos;s define the solution. Focus on
              the user journey:
            </p>
            <ul className="text-xs text-text-muted list-disc list-inside space-y-1">
              <li>What is the core value proposition in action?</li>
              <li>What are the key features needed to deliver that value?</li>
              <li>How does the user move from A to B within the product?</li>
            </ul>
          </div>
        </div>

        {/* Right column — Product Summary (rich text) */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Product Summary*
            </label>
            <RichTextEditor
              content={summary}
              onChange={setSummary}
              editable={!isSaving && !isRegenerating}
            />
          </div>
        </div>
      </div>

      {/* Feature List & Logic — full width */}
      {features && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Feature List &amp; Logic
          </h3>
          <div
            className="rounded-lg border border-border bg-surface p-4 prose prose-sm prose-invert max-w-none text-text-secondary"
            dangerouslySetInnerHTML={{ __html: features }}
          />
        </div>
      )}

      {/* User Type Flows */}
      {userTypes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            User Flows
          </h3>

          {/* User type pills */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="User types">
            {userTypes.map((ut) => (
              <button
                key={ut.id}
                role="tab"
                aria-selected={ut.id === selectedUserType}
                onClick={() => setSelectedUserType(ut.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  ut.id === selectedUserType
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted"
                )}
              >
                {ut.name}
              </button>
            ))}
          </div>

          {/* Selected user type flows */}
          {selectedType && (
            <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
              {selectedType.description && (
                <p className="text-sm text-text-secondary">
                  {selectedType.description}
                </p>
              )}
              {selectedType.flows && (
                <div
                  className="prose prose-sm prose-invert max-w-none text-text-secondary"
                  dangerouslySetInnerHTML={{ __html: selectedType.flows }}
                />
              )}
              {!selectedType.description && !selectedType.flows && (
                <p className="text-sm text-text-muted italic">
                  No flow content yet.
                </p>
              )}
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
            : "Regenerate New Product Summary and Feature List & Logic"}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || isRegenerating}
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
  );
}
