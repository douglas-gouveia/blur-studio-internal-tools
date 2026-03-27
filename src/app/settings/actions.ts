/**
 * Server actions for user AI settings.
 * Handles upsert and retrieval of per-user AI configuration.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AiService, SaveAiSettingsPayload } from "@/types/settings";

const PATH = "/settings";
const TABLE = "user_ai_settings" as never;

/** Row shape for user_ai_settings (until generated types are updated). */
interface AiSettingsRow {
  user_id: string;
  active_service: string | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  claude_api_key: string | null;
  openai_model: string | null;
  gemini_model: string | null;
  claude_model: string | null;
}

/** Save (upsert) the user's AI settings. */
export async function saveAiSettings(
  payload: SaveAiSettingsPayload
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Build the row to upsert
  const row: Record<string, unknown> = {
    user_id: user.id,
    active_service: payload.activeService,
    openai_model: payload.openaiModel,
    gemini_model: payload.geminiModel,
    claude_model: payload.claudeModel,
  };

  // Only update key fields that were explicitly provided
  if (payload.openaiApiKey !== undefined) {
    row.openai_api_key = payload.openaiApiKey || null;
  }
  if (payload.geminiApiKey !== undefined) {
    row.gemini_api_key = payload.geminiApiKey || null;
  }
  if (payload.claudeApiKey !== undefined) {
    row.claude_api_key = payload.claudeApiKey || null;
  }

  // Check if row exists
  const { data: existing } = await supabase
    .from(TABLE)
    .select("user_id")
    .eq("user_id" as never, user.id)
    .maybeSingle();

  if (existing) {
    // Don't include user_id in the update payload
    const { user_id: _, ...updateData } = row;
    const { error } = await supabase
      .from(TABLE)
      .update(updateData as never)
      .eq("user_id" as never, user.id);
    if (error) return { error: (error as { message: string }).message };
  } else {
    // For insert, we need all key fields — default missing ones to null
    if (row.openai_api_key === undefined) row.openai_api_key = null;
    if (row.gemini_api_key === undefined) row.gemini_api_key = null;
    if (row.claude_api_key === undefined) row.claude_api_key = null;
    const { error } = await supabase
      .from(TABLE)
      .insert(row as never);
    if (error) return { error: (error as { message: string }).message };
  }

  revalidatePath(PATH);
  revalidatePath("/sandbox-planner");
  return {};
}

/**
 * Get the active AI service config for the current user.
 * Returns the API key, model, and service name.
 * Server-only — never exposed to client.
 */
export async function getAiSettingsForGeneration(): Promise<{
  service: AiService;
  apiKey: string;
  model: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from(TABLE)
    .select(
      "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
    )
    .eq("user_id" as never, user.id)
    .maybeSingle();

  const settings = data as unknown as AiSettingsRow | null;
  if (!settings?.active_service) return null;

  const service = settings.active_service as AiService;
  const keyMap: Record<AiService, string | null> = {
    openai: settings.openai_api_key,
    gemini: settings.gemini_api_key,
    claude: settings.claude_api_key,
  };
  const modelMap: Record<AiService, string> = {
    openai: settings.openai_model ?? "gpt-4.1",
    gemini: settings.gemini_model ?? "gemini-2.5-flash",
    claude: settings.claude_model ?? "claude-sonnet-4-20250514",
  };

  const apiKey = keyMap[service];
  if (!apiKey) return null;

  return { service, apiKey, model: modelMap[service] };
}
