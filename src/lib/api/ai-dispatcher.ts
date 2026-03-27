/**
 * AI dispatcher — routes AI generation requests to the correct provider.
 * Thin layer over openai.ts, gemini.ts, and claude.ts.
 */

import type { AiService } from "@/types/settings";
import { generateOpenAIJsonResponse } from "./openai";
import { generateGeminiJsonResponse } from "./gemini";
import { generateClaudeJsonResponse } from "./claude";

export interface AiGenerationParams {
  /** Which AI service to use */
  service: AiService;
  /** Decrypted API key for the service */
  apiKey: string;
  /** Model identifier (e.g. "gpt-4.1", "gemini-2.5-flash") */
  model: string;
  /** The prompt text */
  prompt: string;
}

/**
 * Generate a JSON response from the specified AI service.
 * Routes to the appropriate provider-specific function.
 */
export async function generateAiJsonResponse<T = unknown>(
  params: AiGenerationParams
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const { service, apiKey, model, prompt } = params;

  switch (service) {
    case "openai":
      return generateOpenAIJsonResponse<T>({
        model,
        input: prompt,
        apiKey,
      });

    case "gemini":
      return generateGeminiJsonResponse<T>(prompt, model, apiKey);

    case "claude":
      return generateClaudeJsonResponse<T>({
        model,
        input: prompt,
        apiKey,
      });

    default:
      return {
        returned_an_error: true,
        error: `Unknown AI service: ${service}`,
      };
  }
}
