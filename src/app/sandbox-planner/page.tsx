/**
 * Sandbox Planner page — server component.
 * Handles auth, data fetching, and renders the client shell.
 * Source: docs/reference_docs/paginas.md — sandbox-planner page
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import SandboxPlannerShell from "./_components/SandboxPlannerShell";
import type {
  Idea,
  IdeaBlock,
  IdeaFull,
  IdeaIcp,
  IdeaUserType,
  IdeaBlockProductDefinition,
  IdeaBlockStructureAlign,
  IdeaOptimizationSuggestion,
  ProjectOption,
} from "@/types/sandbox-planner";
import type { AiService, UserAiSettingsClient } from "@/types/settings";

interface PageProps {
  searchParams: Promise<{ idea?: string; tab?: string; project?: string }>;
}

export default async function SandboxPlannerPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", user.id)
    .single();

  const params = await searchParams;
  const ideaId = params.idea;
  const tabParam = params.tab as IdeaBlock | undefined;
  const projectParam = params.project ?? null;

  // Fetch ideas, projects, and AI settings in parallel
  const [{ data: ideasData }, { data: projectsData }, { data: aiSettingsData }] =
    await Promise.all([
      supabase
        .from("idea")
        .select("id, project_id, created_by, name, score, description, success_metrics, current_block_ended, current_blocks_updating, created_at, project:project_id(id, name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("project")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase
        .from("user_ai_settings" as never)
        .select(
          "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
        )
        .eq("user_id" as never, user.id)
        .maybeSingle(),
    ]);

  const ideas = (ideasData ?? []) as unknown as Idea[];
  const projects = (projectsData ?? []) as unknown as ProjectOption[];

  // Cast AI settings since generated types may not include the new table yet
  const aiSettingsRow = aiSettingsData as unknown as {
    active_service: string | null;
    openai_api_key: string | null;
    gemini_api_key: string | null;
    claude_api_key: string | null;
    openai_model: string | null;
    gemini_model: string | null;
    claude_model: string | null;
  } | null;

  // Determine if AI is configured (active service + key for that service)
  const hasAiConfigured = (() => {
    if (!aiSettingsRow?.active_service) return false;
    const keyField = `${aiSettingsRow.active_service}_api_key` as keyof typeof aiSettingsRow;
    return !!aiSettingsRow[keyField];
  })();

  // Mask keys for client
  const aiSettings: UserAiSettingsClient = {
    activeService: (aiSettingsRow?.active_service as AiService) ?? null,
    openaiKeySet: !!aiSettingsRow?.openai_api_key,
    geminiKeySet: !!aiSettingsRow?.gemini_api_key,
    claudeKeySet: !!aiSettingsRow?.claude_api_key,
    openaiModel: aiSettingsRow?.openai_model ?? "gpt-4.1",
    geminiModel: aiSettingsRow?.gemini_model ?? "gemini-2.5-flash",
    claudeModel: aiSettingsRow?.claude_model ?? "claude-sonnet-4-20250514",
  };

  // If an idea is selected, fetch full data for refinement steps
  let ideaFull: IdeaFull | null = null;

  if (ideaId) {
    const selectedIdea = ideas.find((i) => i.id === ideaId);
    if (!selectedIdea) {
      redirect("/sandbox-planner");
    }

    const [
      { data: structureAlignData },
      { data: icpsData },
      { data: userTypesData },
      { data: productDefData },
      { data: suggestionsData },
    ] = await Promise.all([
      supabase
        .from("idea_block_structure_and_align")
        .select("id, idea_id, success_metrics_text, product_overview_text, essential_features_text, success_metrics, target_audience, core_problem, created_at")
        .eq("idea_id", ideaId)
        .maybeSingle(),
      supabase
        .from("idea_icp")
        .select("id, idea_id, name, title, subtitle, description, day_in_life, score, picture, tags, jtbd, pitch_need, pain_points, firmographics, pitch_benefit, pitch_approach, psychographics, pitch_competition, value_proposition_icp_pains, value_proposition_icp_gains, created_at")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true }),
      supabase
        .from("idea_user_type")
        .select("id, idea_id, name, flows, description, created_at")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true }),
      supabase
        .from("idea_block_product_definition_and_flows")
        .select("id, idea_id, created_by, summary, features, created_at")
        .eq("idea_id", ideaId)
        .maybeSingle(),
      supabase
        .from("idea_optimization_suggestion")
        .select("id, idea_id, icp_id, name, description, created_at")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true }),
    ]);

    ideaFull = {
      idea: selectedIdea,
      structureAlign: (structureAlignData as unknown as IdeaBlockStructureAlign) ?? null,
      icps: (icpsData ?? []) as unknown as IdeaIcp[],
      userTypes: (userTypesData ?? []) as unknown as IdeaUserType[],
      productDefinition: (productDefData as unknown as IdeaBlockProductDefinition) ?? null,
      optimizationSuggestions: (suggestionsData ?? []) as unknown as IdeaOptimizationSuggestion[],
    };
  }

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User";

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex flex-col flex-1 ml-[220px] min-w-0 overflow-hidden">
        <SandboxPlannerShell
          ideas={ideas}
          projects={projects}
          ideaFull={ideaFull}
          initialTab={tabParam ?? "ideas"}
          userName={userName}
          selectedProjectId={projectParam}
          hasAiConfigured={hasAiConfigured}
          aiSettings={aiSettings}
        />
      </main>
    </div>
  );
}
