/**
 * PromptsShell — client component for managing AI prompt templates.
 * Displays each prompt group as a card with editable group name and prompt content.
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updatePrompt, updatePromptGroupName } from "../actions";
import type { PromptGroupRow } from "../actions";

const VARIABLE_HINTS: Record<string, string[]> = {
  structure_align: ["{{idea_name}}", "{{idea_description}}"],
  refining_icp: ["{{idea_name}}", "{{idea_description}}", "{{core_problem}}", "{{target_audience}}"],
  product_definition_flows: ["{{idea_name}}", "{{idea_description}}", "{{core_problem}}", "{{target_audience}}", "{{icp_names}}"],
  strategic_frameworks: ["{{idea_name}}", "{{idea_description}}", "{{core_problem}}", "{{target_audience}}", "{{icp_descriptions}}"],
};

interface PromptsShellProps {
  groups: PromptGroupRow[];
}

export default function PromptsShell({ groups }: PromptsShellProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Prompt Templates</h1>
        <p className="text-sm text-text-muted mt-1">
          Edit the AI prompts used to generate each step of the Sandbox Planner.
          Use <code className="bg-muted px-1 rounded text-xs">{"{{variable}}"}</code> placeholders
          that will be replaced with real data at generation time.
        </p>
      </div>

      {groups.map((group) => (
        <PromptGroupCard key={group.id} group={group} />
      ))}

      {groups.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          No prompt groups found. Run the migration to seed initial data.
        </div>
      )}
    </div>
  );
}

function PromptGroupCard({ group }: { group: PromptGroupRow }) {
  const [groupName, setGroupName] = useState(group.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [promptContent, setPromptContent] = useState(group.prompt?.prompt_1 ?? "");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptSaved, setPromptSaved] = useState(false);

  const hints = VARIABLE_HINTS[group.step] ?? [];
  const nameChanged = groupName.trim() !== group.name;

  async function handleSaveName() {
    if (!nameChanged || isSavingName) return;
    setIsSavingName(true);
    setNameError(null);
    const result = await updatePromptGroupName(group.id, groupName.trim());
    setIsSavingName(false);
    if (result.error) setNameError(result.error);
  }

  async function handleSavePrompt() {
    if (!group.prompt?.id || isSavingPrompt) return;
    setIsSavingPrompt(true);
    setPromptError(null);
    setPromptSaved(false);
    const result = await updatePrompt(group.prompt.id, promptContent);
    setIsSavingPrompt(false);
    if (result.error) {
      setPromptError(result.error);
    } else {
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 2000);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-border bg-elevated flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className={cn(
              "flex-1 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold",
              "bg-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            )}
          />
          {nameChanged && (
            <button
              onClick={handleSaveName}
              disabled={isSavingName}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white",
                "hover:bg-accent/90 transition-colors disabled:opacity-50"
              )}
            >
              {isSavingName ? "Saving..." : "Save name"}
            </button>
          )}
        </div>
        <span className="text-xs text-text-muted bg-muted px-2 py-1 rounded font-mono shrink-0">
          {group.step}
        </span>
      </div>

      {nameError && (
        <p className="px-5 pt-2 text-xs text-red-400" role="alert">{nameError}</p>
      )}

      {/* Variable hints */}
      {hints.length > 0 && (
        <div className="px-5 pt-4 pb-0 flex flex-wrap gap-1.5">
          <span className="text-xs text-text-muted mr-1">Available variables:</span>
          {hints.map((v) => (
            <code key={v} className="text-xs bg-muted text-text-secondary px-1.5 py-0.5 rounded font-mono">
              {v}
            </code>
          ))}
        </div>
      )}

      {/* Prompt content */}
      <div className="px-5 py-4 space-y-3">
        {group.prompt ? (
          <>
            <textarea
              value={promptContent}
              onChange={(e) => {
                setPromptContent(e.target.value);
                setPromptSaved(false);
              }}
              rows={14}
              disabled={isSavingPrompt}
              className={cn(
                "w-full rounded-lg border border-border px-3 py-2.5 text-sm font-mono",
                "bg-base text-text-primary placeholder:text-text-muted resize-y",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                "disabled:opacity-50"
              )}
            />

            {promptError && (
              <p className="text-xs text-red-400" role="alert">{promptError}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              {promptSaved && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
              <button
                onClick={handleSavePrompt}
                disabled={isSavingPrompt}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-green-600 text-white hover:bg-green-700 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {isSavingPrompt ? "Saving..." : "Save Prompt"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-muted italic">
            No prompt seeded for this group yet (step: <code>{group.step}</code>).
          </p>
        )}
      </div>
    </div>
  );
}
