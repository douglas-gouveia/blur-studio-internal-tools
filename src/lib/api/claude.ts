/**
 * Anthropic Claude API Utility
 * Endpoint: POST https://api.anthropic.com/v1/messages
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ClaudeContentBlock {
  type: "text";
  text: string;
}

export interface ClaudeResponseBody {
  id: string;
  type: "message";
  role: "assistant";
  content: ClaudeContentBlock[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeResult {
  body?: ClaudeResponseBody;
  returned_an_error: boolean;
  status_code?: number;
  status_message?: string;
  /** Convenience: first text content from the response */
  text?: string;
}

export interface ClaudeRequestParams {
  /** Model to use, e.g. "claude-sonnet-4-20250514" */
  model: string;
  /** The prompt / user message */
  input: string;
  /** Optional system instructions */
  instructions?: string;
  /** Max tokens to generate (default: 4096) */
  maxTokens?: number;
  /** Optional API key — falls back to CLAUDE_API_KEY env var */
  apiKey?: string;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Send a message to the Anthropic Claude Messages API.
 */
export async function generateClaudeResponse(
  params: ClaudeRequestParams
): Promise<ClaudeResult> {
  const apiKey = params.apiKey ?? process.env.CLAUDE_API_KEY;
  if (!apiKey)
    throw new Error(
      "Missing Claude API key: provide apiKey param or set CLAUDE_API_KEY env var"
    );

  const { model, input, instructions, maxTokens = 4096 } = params;

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: input }],
  };

  if (instructions) {
    body.system = instructions;
  }

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message:
        (err as { error?: { message?: string } }).error?.message ??
        res.statusText,
    };
  }

  const data = (await res.json()) as ClaudeResponseBody;
  const text = data.content?.find((c) => c.type === "text")?.text;

  return {
    returned_an_error: false,
    body: data,
    text,
  };
}

// ── Convenience: generate + parse JSON response ───────────────────────────────

/**
 * Generate a response from Claude and parse the output as JSON.
 */
export async function generateClaudeJsonResponse<T = unknown>(
  params: Omit<ClaudeRequestParams, "instructions"> & { instructions?: string }
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const result = await generateClaudeResponse({
    ...params,
    instructions: [
      params.instructions,
      "Return ONLY valid JSON. Do not include markdown code fences or any text outside the JSON object.",
    ]
      .filter(Boolean)
      .join("\n\n"),
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
