/**
 * Reusable AI settings form.
 * Used by both the Settings page and the AI settings popup modal.
 * Manages API keys, active service, and model selection.
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  AiService,
  UserAiSettingsClient,
  SaveAiSettingsPayload,
} from "@/types/settings";
import {
  AI_SERVICE_LABELS,
  AI_SERVICE_VALUES,
  DEFAULT_MODELS,
} from "@/types/settings";

interface AiSettingsFormProps {
  /** Current settings (keys masked to booleans). */
  initialSettings: UserAiSettingsClient;
  /** Server action to save settings. */
  onSave: (payload: SaveAiSettingsPayload) => Promise<{ error?: string }>;
  /** Called after a successful save. */
  onSuccess?: () => void;
  /** Label for the submit button. Defaults to "Save Settings". */
  submitLabel?: string;
}

/** Form for configuring AI service, API keys, and model selection. */
export default function AiSettingsForm({
  initialSettings,
  onSave,
  onSuccess,
  submitLabel = "Save Settings",
}: AiSettingsFormProps) {
  const [activeService, setActiveService] = useState<AiService | "">(
    initialSettings.activeService ?? ""
  );
  const [openaiModel, setOpenaiModel] = useState(initialSettings.openaiModel);
  const [geminiModel, setGeminiModel] = useState(initialSettings.geminiModel);
  const [claudeModel, setClaudeModel] = useState(initialSettings.claudeModel);

  // Key fields — empty string means unchanged; new value means replace
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");

  // Track whether user wants to change an existing key
  const [editingOpenaiKey, setEditingOpenaiKey] = useState(
    !initialSettings.openaiKeySet
  );
  const [editingGeminiKey, setEditingGeminiKey] = useState(
    !initialSettings.geminiKeySet
  );
  const [editingClaudeKey, setEditingClaudeKey] = useState(
    !initialSettings.claudeKeySet
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const payload: SaveAiSettingsPayload = {
      activeService: activeService || null,
      openaiModel,
      geminiModel,
      claudeModel,
    };

    // Only include key fields if user is editing them
    if (editingOpenaiKey) payload.openaiApiKey = openaiKey;
    if (editingGeminiKey) payload.geminiApiKey = geminiKey;
    if (editingClaudeKey) payload.claudeApiKey = claudeKey;

    const result = await onSave(payload);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    onSuccess?.();
  }

  const inputClass = cn(
    "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
    "disabled:opacity-50"
  );

  const selectClass = cn(
    "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
    "disabled:opacity-50"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Active Service */}
      <div>
        <label
          htmlFor="ai-active-service"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Active AI Service
        </label>
        <select
          id="ai-active-service"
          value={activeService}
          onChange={(e) => setActiveService(e.target.value as AiService | "")}
          disabled={isSubmitting}
          className={selectClass}
        >
          <option value="">None (disabled)</option>
          {AI_SERVICE_VALUES.map((s) => (
            <option key={s} value={s}>
              {AI_SERVICE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Per-service config sections */}
      {AI_SERVICE_VALUES.map((service) => {
        const keySet =
          service === "openai"
            ? initialSettings.openaiKeySet
            : service === "gemini"
              ? initialSettings.geminiKeySet
              : initialSettings.claudeKeySet;
        const keyValue =
          service === "openai"
            ? openaiKey
            : service === "gemini"
              ? geminiKey
              : claudeKey;
        const setKeyValue =
          service === "openai"
            ? setOpenaiKey
            : service === "gemini"
              ? setGeminiKey
              : setClaudeKey;
        const editing =
          service === "openai"
            ? editingOpenaiKey
            : service === "gemini"
              ? editingGeminiKey
              : editingClaudeKey;
        const setEditing =
          service === "openai"
            ? setEditingOpenaiKey
            : service === "gemini"
              ? setEditingGeminiKey
              : setEditingClaudeKey;
        const modelValue =
          service === "openai"
            ? openaiModel
            : service === "gemini"
              ? geminiModel
              : claudeModel;
        const setModelValue =
          service === "openai"
            ? setOpenaiModel
            : service === "gemini"
              ? setGeminiModel
              : setClaudeModel;
        const isActive = activeService === service;

        return (
          <fieldset
            key={service}
            className={cn(
              "rounded-lg border p-4 space-y-4 transition-opacity",
              isActive
                ? "border-accent/50 bg-accent/5"
                : "border-border opacity-60"
            )}
          >
            <legend className="px-2 text-sm font-semibold text-text-primary">
              {AI_SERVICE_LABELS[service]}
              {isActive && (
                <span className="ml-2 text-xs font-normal text-accent">
                  Active
                </span>
              )}
            </legend>

            {/* API Key */}
            <div>
              <label
                htmlFor={`ai-key-${service}`}
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                API Key
              </label>
              {keySet && !editing ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-muted">
                    Key is configured
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className={cn(
                      "text-xs text-accent hover:text-accent/80 underline",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                    )}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <input
                  id={`ai-key-${service}`}
                  type="password"
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder={`Enter ${AI_SERVICE_LABELS[service]} API key...`}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              )}
            </div>

            {/* Model */}
            <div>
              <label
                htmlFor={`ai-model-${service}`}
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Model
              </label>
              <input
                id={`ai-model-${service}`}
                type="text"
                value={modelValue}
                onChange={(e) => setModelValue(e.target.value)}
                placeholder="Model name..."
                disabled={isSubmitting}
                list={`models-${service}`}
                className={inputClass}
              />
              <datalist id={`models-${service}`}>
                {DEFAULT_MODELS[service].map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </fieldset>
        );
      })}

      {/* Error / Success messages */}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-sm text-green-400" role="status">
          Settings saved successfully.
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "bg-accent text-white hover:bg-accent/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
