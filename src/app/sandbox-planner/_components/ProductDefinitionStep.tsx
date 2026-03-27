/**
 * Step 4 — Product Definition & Flows.
 * Left column: readonly idea context + product architecture notes.
 * Right column: rich text Product Summary editor.
 * Below: editable Feature List & Logic, user type pills (+ create/delete),
 * editable User Flow per type, with AI regeneration buttons.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull, IdeaUserType } from "@/types/sandbox-planner";
import {
  saveProductDefinition,
  triggerAiGeneration,
  createUserType,
  updateUserType,
  deleteUserType,
} from "../actions";
import { cn } from "@/lib/utils";
import RichTextEditor from "./RichTextEditor";
import AiLoadingOverlay from "./AiLoadingOverlay";

interface ProductDefinitionStepProps {
  ideaFull: IdeaFull;
}

export default function ProductDefinitionStep({ ideaFull }: ProductDefinitionStepProps) {
  const { idea, structureAlign, productDefinition, userTypes: initialUserTypes } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "product_definition_flows";

  const [summary, setSummary] = useState(productDefinition?.summary ?? "");
  const [features, setFeatures] = useState(productDefinition?.features ?? "");
  const [userTypes, setUserTypes] = useState<IdeaUserType[]>(initialUserTypes);
  const [selectedUserTypeId, setSelectedUserTypeId] = useState<string | null>(
    initialUserTypes[0]?.id ?? null
  );
  const [flowContent, setFlowContent] = useState<Record<string, string>>(
    Object.fromEntries(initialUserTypes.map((ut) => [ut.id, ut.flows ?? ""]))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create user type modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedType = userTypes.find((u) => u.id === selectedUserTypeId) ?? null;

  useEffect(() => {
    setSummary(productDefinition?.summary ?? "");
    setFeatures(productDefinition?.features ?? "");
  }, [productDefinition?.summary, productDefinition?.features]);

  useEffect(() => {
    setUserTypes(initialUserTypes);
    setFlowContent(Object.fromEntries(initialUserTypes.map((ut) => [ut.id, ut.flows ?? ""])));
    setSelectedUserTypeId((prev) =>
      initialUserTypes.find((ut) => ut.id === prev)
        ? prev
        : (initialUserTypes[0]?.id ?? null)
    );
  }, [initialUserTypes]);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    // Save product definition (summary + features)
    const result = await saveProductDefinition(idea.id, { summary, features });
    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    // Save flows for all user types that were changed
    for (const ut of userTypes) {
      const flow = flowContent[ut.id] ?? "";
      if (flow !== (ut.flows ?? "")) {
        await updateUserType(ut.id, { flows: flow });
      }
    }

    setIsSaving(false);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    const result = await triggerAiGeneration(idea.id, "product_definition_flows");
    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  async function handleCreateUserType() {
    if (!newTypeName.trim()) {
      setCreateError("Name is required.");
      return;
    }
    setIsCreating(true);
    setCreateError(null);

    const result = await createUserType(idea.id, {
      name: newTypeName.trim(),
      description: newTypeDesc.trim() || undefined,
    });

    if (result.error) {
      setCreateError(result.error);
      setIsCreating(false);
      return;
    }

    const newType: IdeaUserType = {
      id: result.id!,
      idea_id: idea.id,
      name: newTypeName.trim(),
      description: newTypeDesc.trim() || null,
      flows: null,
      created_at: new Date().toISOString(),
    };

    setUserTypes((prev) => [...prev, newType]);
    setFlowContent((prev) => ({ ...prev, [result.id!]: "" }));
    setSelectedUserTypeId(result.id!);
    setNewTypeName("");
    setNewTypeDesc("");
    setShowCreateModal(false);
    setIsCreating(false);
  }

  async function handleDeleteUserType(id: string) {
    const result = await deleteUserType(id);
    if (result.error) { setError(result.error); return; }

    setUserTypes((prev) => {
      const next = prev.filter((ut) => ut.id !== id);
      if (selectedUserTypeId === id) {
        setSelectedUserTypeId(next[0]?.id ?? null);
      }
      return next;
    });
    setFlowContent((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  if (isAiWorking) {
    return <AiLoadingOverlay step="product_definition_flows" />;
  }

  return (
    <div className="space-y-6">
      {/* ── Top two-column grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Readonly context */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Original Idea*</h3>
            <div className="rounded-lg border border-border bg-surface p-4">
              <h4 className="text-sm font-bold text-text-primary mb-2">{idea.name}</h4>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {idea.description ?? "No description provided."}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Finalized Core Problem*</h3>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {structureAlign?.core_problem ?? "Not defined yet."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Product Architecture</h3>
            <p className="text-xs text-text-muted mb-2">
              Now that we know the problem, let&apos;s define the solution. Focus on the user journey:
            </p>
            <ul className="text-xs text-text-muted list-disc list-inside space-y-1">
              <li>What is the core value proposition in action?</li>
              <li>What are the key features needed to deliver that value?</li>
              <li>How does the user move from A to B within the product?</li>
            </ul>
          </div>
        </div>

        {/* Right column — Product Summary + Feature List & Logic + Regenerate */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Product Summary*</label>
            <RichTextEditor
              content={summary}
              onChange={setSummary}
              editable={!isSaving && !isRegenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">
              Feature List &amp; Logic
            </label>
            <RichTextEditor
              content={features}
              onChange={setFeatures}
              editable={!isSaving && !isRegenerating}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating || isSaving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-accent text-white hover:bg-accent/90 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <IconRefresh />
              {isRegenerating
                ? "Regenerating..."
                : "Regenerate New Product Summary and Feature List & Logic"}
            </button>
          </div>
        </div>
      </div>

      {/* ── User Type Flows ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">User Flow</h3>
        </div>

        {/* Pills row */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="User types">
          {userTypes.map((ut) => (
            <div key={ut.id} className="flex items-center gap-0.5">
              <button
                role="tab"
                aria-selected={ut.id === selectedUserTypeId}
                onClick={() => setSelectedUserTypeId(ut.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  ut.id === selectedUserTypeId
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted"
                )}
              >
                {ut.name}
              </button>
              <button
                onClick={() => handleDeleteUserType(ut.id)}
                aria-label={`Delete ${ut.name}`}
                className="p-1 rounded text-text-muted hover:text-red-400 transition-colors focus-visible:outline-none"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* + User Type button */}
          <button
            onClick={() => { setShowCreateModal(true); setCreateError(null); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium",
              "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            User Type
          </button>
        </div>

        {/* Selected user type flow editor */}
        {selectedType && (
          <div className="space-y-2">
            {selectedType.description && (
              <p className="text-sm text-text-muted italic">{selectedType.description}</p>
            )}
            <RichTextEditor
              content={flowContent[selectedType.id] ?? ""}
              onChange={(html) =>
                setFlowContent((prev) => ({ ...prev, [selectedType.id]: html }))
              }
              editable={!isSaving && !isRegenerating}
            />
            <div className="flex justify-end pt-1">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating || isSaving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-accent text-white hover:bg-accent/90 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <IconRefresh />
                {isRegenerating
                  ? "Regenerating..."
                  : `Regenerate New User Flow for ${selectedType.name}`}
              </button>
            </div>
          </div>
        )}

        {userTypes.length === 0 && (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="text-sm text-text-muted italic">No user types yet.</p>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating || isSaving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-accent text-white hover:bg-accent/90 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <IconRefresh />
              {isRegenerating ? "Generating..." : "Generate User Flows with AI"}
            </button>
          </div>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-400" role="alert">{error}</p>
      )}

      {/* ── Save button ──────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || isRegenerating}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
            "bg-green-600 text-white hover:bg-green-700 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* ── Create User Type Modal ────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create User Type</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name*
                </label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Name here..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  placeholder="Describe here the main problem you are trying to solve..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setNewTypeName(""); setNewTypeDesc(""); setCreateError(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline-none"
              >
                Close
              </button>
              <button
                onClick={handleCreateUserType}
                disabled={isCreating}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors",
                  "bg-accent hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
