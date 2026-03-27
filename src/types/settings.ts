/**
 * Types for user AI settings.
 * Maps to the `user_ai_settings` table and `os_ai_service` enum.
 */

/** AI service enum — matches PostgreSQL `os_ai_service`. */
export type AiService = "openai" | "gemini" | "claude";

/** Human-readable labels for each AI service. */
export const AI_SERVICE_LABELS: Record<AiService, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  claude: "Anthropic Claude",
};

/** Ordered list of AI service values. */
export const AI_SERVICE_VALUES: AiService[] = ["openai", "gemini", "claude"];

/** Suggested models per AI service. */
export const DEFAULT_MODELS: Record<AiService, string[]> = {
  openai: ["gpt-4.1", "gpt-4o", "o3"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
  claude: ["claude-sonnet-4-20250514", "claude-opus-4-20250514"],
};

/** Client-safe AI settings shape — API keys masked to booleans. */
export interface UserAiSettingsClient {
  activeService: AiService | null;
  openaiKeySet: boolean;
  geminiKeySet: boolean;
  claudeKeySet: boolean;
  openaiModel: string;
  geminiModel: string;
  claudeModel: string;
}

/** Payload sent from the settings form to the server action. */
export interface SaveAiSettingsPayload {
  activeService: AiService | null;
  /** undefined = keep existing key, empty string = clear key */
  openaiApiKey?: string;
  geminiApiKey?: string;
  claudeApiKey?: string;
  openaiModel: string;
  geminiModel: string;
  claudeModel: string;
}
