/**
 * OpenAI Responses API Utility
 * Source: docs/reference_docs/api-connectors.md — OpenAI connector
 * Endpoint: POST https://api.openai.com/v1/responses
 * Model used in Bubble: GPT-5 (or latest available)
 */

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OpenAIResponseOutputContent {
  type: string;
  text: string;
}

export interface OpenAIResponseOutput {
  id: string;
  type: string;
  status: string;
  role: string;
  content: OpenAIResponseOutputContent[];
}

export interface OpenAIUsage {
  input_tokens: number;
  input_tokens_details: { cached_tokens: number };
  output_tokens: number;
  output_tokens_details: { reasoning_tokens: number };
  total_tokens: number;
}

export interface OpenAIResponseBody {
  id: string;
  object: string;
  created_at: number;
  status: string;
  model: string;
  output: OpenAIResponseOutput[];
  usage: OpenAIUsage;
  error?: string;
}

export interface OpenAIResult {
  body?: OpenAIResponseBody;
  returned_an_error: boolean;
  status_code?: number;
  status_message?: string;
  /** Convenience: first text content from the first output message */
  text?: string;
}

export interface OpenAIRequestParams {
  /** Model to use, e.g. "gpt-4o", "o3", "gpt-4.1" */
  model: string;
  /** The prompt / user message */
  input: string;
  /** Response format type — "text" or "json_object" */
  format?: "text" | "json_object";
  /** Optional system instructions */
  instructions?: string;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Send a message to OpenAI via the Responses API.
 * Source: "Message" call in Bubble OpenAI connector.
 */
export async function generateOpenAIResponse(
  params: OpenAIRequestParams
): Promise<OpenAIResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing env: OPENAI_API_KEY");

  const { model, input, format = "text", instructions } = params;

  const body: Record<string, unknown> = {
    model,
    input,
    text: {
      format: { type: format },
    },
  };

  if (instructions) {
    body.instructions = instructions;
  }

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message: (err as { error?: { message?: string } }).error?.message ?? res.statusText,
    };
  }

  const data = (await res.json()) as OpenAIResponseBody;

  // Extract the first text content for convenience
  const text = data.output?.[0]?.content?.find((c) => c.type === "output_text")?.text;

  return {
    returned_an_error: false,
    body: data,
    text,
  };
}

// ── Convenience: generate + parse JSON response ───────────────────────────────

/**
 * Generate a response and parse the output as JSON.
 * Used by Bubble's "Message (copy)" pattern — extract structured JSON from AI output.
 */
export async function generateOpenAIJsonResponse<T = unknown>(
  params: Omit<OpenAIRequestParams, "format">
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const result = await generateOpenAIResponse({ ...params, format: "json_object" });

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
