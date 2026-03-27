/**
 * Settings shell — client wrapper for the AI settings form on the Settings page.
 */
"use client";

import AiSettingsForm from "@/components/features/AiSettingsForm";
import type { UserAiSettingsClient } from "@/types/settings";
import { saveAiSettings } from "../actions";

interface SettingsShellProps {
  /** Current user AI settings (keys masked). */
  settings: UserAiSettingsClient;
}

/** Wraps the reusable AiSettingsForm with the save server action. */
export default function SettingsShell({ settings }: SettingsShellProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          AI Configuration
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Configure your AI service, API keys, and preferred models. These
          settings are used when generating content in the Sandbox Planner.
        </p>
      </div>
      <AiSettingsForm initialSettings={settings} onSave={saveAiSettings} />
    </div>
  );
}
