/**
 * Server Actions for Sandbox Planner.
 * Handles CRUD for ideas and related entities, plus AI generation triggers.
 * Source: docs/reference_docs/paginas.md — sandbox-planner workflows
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { IdeaBlock } from "@/types/sandbox-planner";
import type { AiService } from "@/types/settings";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import type { StructureAlignOutput } from "@/lib/api/json-converters";
import type { ICPsOutput } from "@/lib/api/json-converters";
import type { ProductDefinitionOutput } from "@/lib/api/json-converters";
import type { StrategicFrameworksOutput } from "@/lib/api/json-converters";

const PATH = "/sandbox-planner";

// ── Idea CRUD ────────────────────────────────────────────────────────────────

/** Create a new idea and return its id. */
export async function createIdea(data: {
  name: string;
  description: string;
  project_id?: string;
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: row, error } = await supabase
    .from("idea")
    .insert({
      name: data.name,
      description: data.description,
      project_id: data.project_id || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: row.id };
}

/** Update an existing idea. */
export async function updateIdea(
  id: string,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Delete an idea and all cascaded children (handled by DB FK ON DELETE CASCADE). */
export async function deleteIdea(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

// ── Structure & Align ────────────────────────────────────────────────────────

/** Upsert structure & align block for an idea. */
export async function saveStructureAlign(
  ideaId: string,
  data: { core_problem: string; target_audience: string; success_metrics: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Check if a row already exists
  const { data: existing } = await supabase
    .from("idea_block_structure_and_align")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_block_structure_and_align")
      .update({
        core_problem: data.core_problem,
        target_audience: data.target_audience,
        success_metrics: data.success_metrics,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_block_structure_and_align")
      .insert({
        idea_id: ideaId,
        core_problem: data.core_problem,
        target_audience: data.target_audience,
        success_metrics: data.success_metrics,
      });
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── ICP CRUD ─────────────────────────────────────────────────────────────────

/** Save ICP profile fields (day_in_life, pain_points, etc.). */
export async function saveIcpProfile(
  icpId: string,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_icp").update(data).eq("id", icpId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Create a new ICP for an idea. */
export async function createIcp(
  ideaId: string,
  data: { name: string; description?: string }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("idea_icp")
    .insert({ idea_id: ideaId, name: data.name, description: data.description || null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: row.id };
}

/** Delete an ICP. */
export async function deleteIcp(icpId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_icp").delete().eq("id", icpId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

// ── Product Definition ───────────────────────────────────────────────────────

/** Upsert product definition block. */
export async function saveProductDefinition(
  ideaId: string,
  data: { summary?: string; features?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("idea_block_product_definition_and_flows")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_block_product_definition_and_flows")
      .update(data)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_block_product_definition_and_flows")
      .insert({
        idea_id: ideaId,
        created_by: user?.id ?? null,
        ...data,
      });
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── User Types ───────────────────────────────────────────────────────────────

/** Create a user type for an idea. */
export async function createUserType(
  ideaId: string,
  data: { name: string; description?: string }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("idea_user_type")
    .insert({ idea_id: ideaId, name: data.name, description: data.description || null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: row.id };
}

/** Update a user type. */
export async function updateUserType(
  id: string,
  data: { name?: string; flows?: string; description?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_user_type").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Delete a user type. */
export async function deleteUserType(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_user_type").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

// ── Strategic Frameworks / Optimization Suggestions ──────────────────────────

/** Save strategic framework fields on an ICP. */
export async function saveStrategicFramework(
  icpId: string,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_icp").update(data).eq("id", icpId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Create an optimization suggestion. */
export async function createOptimizationSuggestion(
  ideaId: string,
  icpId: string,
  data: { name: string; description?: string }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("idea_optimization_suggestion")
    .insert({
      idea_id: ideaId,
      icp_id: icpId,
      name: data.name,
      description: data.description || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: row.id };
}

/** Update an optimization suggestion. */
export async function saveOptimizationSuggestion(
  id: string,
  data: { name?: string; description?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("idea_optimization_suggestion")
    .update(data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Delete an optimization suggestion. */
export async function deleteOptimizationSuggestion(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("idea_optimization_suggestion")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

// ── Prompt DB Helpers ─────────────────────────────────────────────────────────

/** Fetch prompt template from DB by step name. Uses service client to bypass RLS. */
async function getPromptTemplate(step: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("prompt" as never)
    .select("description")
    .eq("type" as never, step)
    .maybeSingle();
  return (data as { description: string | null } | null)?.description ?? null;
}

/** Replace {{variable}} placeholders in a template string. */
function renderPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

const FALLBACK_STRUCTURE_ALIGN = `You are a business analyst. Given the following startup idea, extract and return a JSON object with exactly these keys:
- "The Core Problem": A detailed description of the core problem this idea solves.
- "Target Audience": A detailed description of the primary target audience.
- "Primary Success Metrics": Specific, quantifiable success metrics.

Idea Name: {{idea_name}}
Idea Description: {{idea_description}}

Return ONLY valid JSON.`;

const FALLBACK_REFINING_ICP = `You are an expert in Ideal Customer Profile analysis. Given the following business idea and its structure, generate 3-5 distinct ICPs.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with key "ICPs" containing an array of objects, each with:
- "name": ICP persona name
- "description": Brief description of this persona
- "operational_environment": Day in the life context and environment
- "strategic_pain_points_and_acute_needs": Key pain points and urgent needs

Return ONLY valid JSON.`;

const FALLBACK_PRODUCT_DEFINITION = `You are a product strategist. Given the following startup idea, define the product.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
ICPs: {{icp_names}}

Return a JSON object with:
- "Product Overview": Rich HTML text describing the product vision and architecture
- "Feature List & Logic": Rich HTML text with features organized by categories
- "User Flows": Array of objects with "user_name" (string), "description" (string), "user_flow" (string with HTML flow description)

Return ONLY valid JSON.`;

const FALLBACK_STRATEGIC_FRAMEWORKS = `You are a strategic business consultant. Generate comprehensive strategic frameworks for each ICP.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

ICPs:
{{icp_descriptions}}

For EACH ICP, return a JSON object with key "ICPs" containing an array of objects with:
- "id": The ICP identifier (use their name as id)
- "name": ICP name
- "value_proposition_icp_pains": Value proposition addressing ICP pains
- "value_proposition_icp_gains": Value proposition gains for this ICP
- "value_proposition_value_map_solutions": Solutions mapped to this ICP
- "value_proposition_value_map_gain_creators": Gain creators for this ICP
- "jtbd": Jobs To Be Done synthesis text
- "architect_title": ICP archetype title
- "architect_subtitle": ICP archetype subtitle
- "architect_tags": Array of descriptor tags
- "architect_psychographics": Psychographic description
- "architect_firmographics": Firmographic description
- "pitch_need": NABC pitch — Need
- "pitch_approach": NABC pitch — Approach
- "pitch_benefit": NABC pitch — Benefit
- "pitch_competition": NABC pitch — Competition

Also include an "optimization_suggestions" array with objects: "name", "description".

Return ONLY valid JSON.`;

// ── AI Generation ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/** AI config resolved from user settings or env fallback. */
interface AiConfig {
  service: AiService;
  apiKey: string;
  model: string;
}

/** Resolve AI config: user settings first, then OpenAI env var fallback. */
async function resolveAiConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<AiConfig | null> {
  const { data: settings } = await supabase
    .from("user_ai_settings")
    .select(
      "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (settings?.active_service) {
    const service = settings.active_service as AiService;
    const keyMap: Record<string, string | null> = {
      openai: settings.openai_api_key,
      gemini: settings.gemini_api_key,
      claude: settings.claude_api_key,
    };
    const modelMap: Record<string, string> = {
      openai: settings.openai_model ?? "gpt-4.1",
      gemini: settings.gemini_model ?? "gemini-2.5-flash",
      claude: settings.claude_model ?? "claude-sonnet-4-20250514",
    };
    const apiKey = keyMap[service];
    if (apiKey) {
      return { service, apiKey, model: modelMap[service] };
    }
  }

  // Fallback to OpenAI env var
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey) {
    return { service: "openai", apiKey: envKey, model: "gpt-4.1" };
  }

  return null;
}

/** Trigger AI generation for a specific step. Long-running — updates idea state before/after. */
export async function triggerAiGeneration(
  ideaId: string,
  step: IdeaBlock,
  icpId?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Resolve AI configuration
  const aiConfig = await resolveAiConfig(supabase, user.id);
  if (!aiConfig) {
    return { error: "No AI service configured. Please set up your API key in Settings." };
  }

  // Mark idea as updating
  await supabase
    .from("idea")
    .update({ current_blocks_updating: step })
    .eq("id", ideaId);

  try {
    // Fetch idea data
    const { data: idea } = await supabase
      .from("idea")
      .select("*")
      .eq("id", ideaId)
      .single();
    if (!idea) return { error: "Idea not found" };

    // Fetch structure & align data if needed
    const { data: structureAlign } = await supabase
      .from("idea_block_structure_and_align")
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle();

    // Fetch existing ICPs if needed
    const { data: icps } = await supabase
      .from("idea_icp")
      .select("*")
      .eq("idea_id", ideaId);

    let result: { error?: string } = {};

    switch (step) {
      case "structure_align":
        result = await generateStructureAlign(supabase, idea, ideaId, aiConfig);
        break;
      case "refining_icp":
        result = await generateRefiningIcp(supabase, idea, structureAlign, ideaId, aiConfig);
        break;
      case "product_definition_flows":
        result = await generateProductDefinition(
          supabase, idea, structureAlign, icps ?? [], ideaId, aiConfig
        );
        break;
      case "strategic_frameworks":
        result = await generateStrategicFrameworks(
          supabase, idea, structureAlign, icps ?? [], ideaId, icpId, aiConfig
        );
        break;
    }

    // Mark step as completed
    await supabase
      .from("idea")
      .update({
        current_blocks_updating: null,
        current_block_ended: step,
      })
      .eq("id", ideaId);

    revalidatePath(PATH);
    return result;
  } catch (e) {
    // Clear updating state on error
    await supabase
      .from("idea")
      .update({ current_blocks_updating: null })
      .eq("id", ideaId);
    revalidatePath(PATH);
    return { error: e instanceof Error ? e.message : "AI generation failed" };
  }
}

// ── AI Generation Helpers (private) ──────────────────────────────────────────

async function generateStructureAlign(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  ideaId: string,
  aiConfig: AiConfig
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("structure_align")) ?? FALLBACK_STRUCTURE_ALIGN;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: idea.description ?? "No description provided.",
  });

  const res = await generateAiJsonResponse<StructureAlignOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_block_structure_and_align")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    core_problem: d["The Core Problem"],
    target_audience: d["Target Audience"],
    success_metrics: d["Primary Success Metrics"],
  };

  if (existing) {
    await supabase
      .from("idea_block_structure_and_align")
      .update(payload)
      .eq("id", existing.id);
  } else {
    await supabase
      .from("idea_block_structure_and_align")
      .insert({ idea_id: ideaId, ...payload });
  }

  return {};
}

async function generateRefiningIcp(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  ideaId: string,
  aiConfig: AiConfig
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("refining_icp")) ?? FALLBACK_REFINING_ICP;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: idea.description ?? "",
    core_problem: structureAlign?.core_problem ?? "Not defined yet",
    target_audience: structureAlign?.target_audience ?? "Not defined yet",
  });

  const res = await generateAiJsonResponse<ICPsOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Delete existing ICPs for this idea, then insert new ones
  await supabase.from("idea_icp").delete().eq("idea_id", ideaId);

  const rows = res.data.ICPs.map((icp) => ({
    idea_id: ideaId,
    name: icp.name,
    description: icp.description ?? null,
    day_in_life: icp.operational_environment,
    pain_points: icp.strategic_pain_points_and_acute_needs,
  }));

  if (rows.length > 0) {
    await supabase.from("idea_icp").insert(rows);
  }

  return {};
}

async function generateProductDefinition(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  icps: { name: string | null; description: string | null }[],
  ideaId: string,
  aiConfig: AiConfig
): Promise<{ error?: string }> {
  const icpNames = icps.map((i) => i.name).filter(Boolean).join(", ");
  const template = (await getPromptTemplate("product_definition_flows")) ?? FALLBACK_PRODUCT_DEFINITION;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: idea.description ?? "",
    core_problem: structureAlign?.core_problem ?? "Not defined yet",
    target_audience: structureAlign?.target_audience ?? "Not defined yet",
    icp_names: icpNames || "None defined yet",
  });

  const res = await generateAiJsonResponse<ProductDefinitionOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const d = res.data;

  // Upsert product definition
  const { data: existing } = await supabase
    .from("idea_block_product_definition_and_flows")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    summary: d["Product Overview"],
    features: d["Feature List & Logic"],
  };

  if (existing) {
    await supabase
      .from("idea_block_product_definition_and_flows")
      .update(payload)
      .eq("id", existing.id);
  } else {
    await supabase
      .from("idea_block_product_definition_and_flows")
      .insert({ idea_id: ideaId, created_by: user?.id ?? null, ...payload });
  }

  // Replace user types from AI-generated user flows
  await supabase.from("idea_user_type").delete().eq("idea_id", ideaId);
  const userTypeRows = (d["User Flows"] ?? []).map((uf) => ({
    idea_id: ideaId,
    name: uf.user_name,
    description: uf.description,
    flows: uf.user_flow,
  }));
  if (userTypeRows.length > 0) {
    await supabase.from("idea_user_type").insert(userTypeRows);
  }

  return {};
}

async function generateStrategicFrameworks(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  icps: { id: string; name: string | null; description: string | null; day_in_life: string | null; pain_points: string | null }[],
  ideaId: string,
  icpId: string | undefined,
  aiConfig: AiConfig
): Promise<{ error?: string }> {
  const targetIcps = icpId ? icps.filter((i) => i.id === icpId) : icps;
  const icpDescriptions = targetIcps
    .map((i) => `- ${i.name}: ${i.description ?? ""} (Day in life: ${i.day_in_life ?? ""}, Pain points: ${i.pain_points ?? ""})`)
    .join("\n");

  const template = (await getPromptTemplate("strategic_frameworks")) ?? FALLBACK_STRATEGIC_FRAMEWORKS;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: idea.description ?? "",
    core_problem: structureAlign?.core_problem ?? "Not defined yet",
    target_audience: structureAlign?.target_audience ?? "Not defined yet",
    icp_descriptions: icpDescriptions,
  });

  const res = await generateAiJsonResponse<StrategicFrameworksOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Update each ICP with framework data
  for (const framework of res.data.ICPs) {
    // Find matching ICP by name
    const matchingIcp = targetIcps.find(
      (i) => i.name?.toLowerCase() === framework.name?.toLowerCase()
    );
    if (!matchingIcp) continue;

    await supabase
      .from("idea_icp")
      .update({
        value_proposition_icp_pains: framework.value_proposition_icp_pains ?? null,
        value_proposition_icp_gains: framework.value_proposition_icp_gains ?? null,
        jtbd: framework.jtbd ?? null,
        title: framework.architect_title ?? null,
        subtitle: framework.architect_subtitle ?? null,
        tags: framework.architect_tags ?? [],
        psychographics: framework.architect_psychographics ?? null,
        firmographics: framework.architect_firmographics ?? null,
        pitch_need: framework.pitch_need ?? null,
        pitch_approach: framework.pitch_approach ?? null,
        pitch_benefit: framework.pitch_benefit ?? null,
        pitch_competition: framework.pitch_competition ?? null,
      })
      .eq("id", matchingIcp.id);

    // Handle optimization suggestions if present
    const suggestions = (framework as unknown as { optimization_suggestions?: { name: string; description: string }[] })
      .optimization_suggestions;
    if (suggestions && suggestions.length > 0) {
      // Delete existing suggestions for this ICP
      await supabase
        .from("idea_optimization_suggestion")
        .delete()
        .eq("icp_id", matchingIcp.id);

      const suggestionRows = suggestions.map((s) => ({
        idea_id: ideaId,
        icp_id: matchingIcp.id,
        name: s.name,
        description: s.description,
      }));
      await supabase.from("idea_optimization_suggestion").insert(suggestionRows);
    }
  }

  return {};
}
