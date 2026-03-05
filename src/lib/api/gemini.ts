/**
 * Gemini (Google Generative AI) Utility
 * Source: docs/reference_docs/api-connectors.md — Gemini connector
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=API_KEY
 * Model used in Bubble: gemini-2.5-flash
 */

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiGenerationConfig {
  response_mime_type?: "application/json" | "text/plain";
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason: string;
  index: number;
}

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResponseBody {
  candidates: GeminiCandidate[];
  usageMetadata: GeminiUsageMetadata;
  modelVersion: string;
}

export interface GeminiResult {
  body?: GeminiResponseBody;
  returned_an_error: boolean;
  status_code?: number;
  status_message?: string;
  /** Convenience: first text from first candidate */
  text?: string;
}

export interface GeminiRequestParams {
  /** Model name, e.g. "gemini-2.5-flash" (default) */
  model?: string;
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Generate content using the Gemini API.
 * Source: "Message" call in Bubble Gemini connector.
 */
export async function generateGeminiContent(
  params: GeminiRequestParams
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing env: GEMINI_API_KEY");

  const { model = "gemini-2.5-flash", contents, generationConfig } = params;

  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = { contents };
  if (generationConfig) body.generationConfig = generationConfig;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message:
        (err as { error?: { message?: string } }).error?.message ?? res.statusText,
    };
  }

  const data = (await res.json()) as GeminiResponseBody;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  return {
    returned_an_error: false,
    body: data,
    text,
  };
}

// ── Convenience: generate + parse JSON response ───────────────────────────────

/**
 * Generate content from Gemini and parse the output as JSON.
 * Mirrors Bubble's pattern of using response_mime_type: "application/json".
 */
export async function generateGeminiJsonResponse<T = unknown>(
  prompt: string,
  model = "gemini-2.5-flash"
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const result = await generateGeminiContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
  });

  if (result.returned_an_error || !result.text) {
    return {
      returned_an_error: true,
      error: result.status_message ?? "No response text",
    };
  }

  try {
    const data = JSON.parse(result.text) as T;
    return { returned_an_error: false, data };
  } catch {
    return {
      returned_an_error: true,
      error: `Failed to parse JSON response: ${result.text.slice(0, 200)}`,
    };
  }
}
