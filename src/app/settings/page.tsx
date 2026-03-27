/**
 * Settings page — server component.
 * Handles auth, fetches user AI settings, and renders the settings shell.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import SettingsShell from "./_components/SettingsShell";
import type { UserAiSettingsClient, AiService } from "@/types/settings";

export default async function SettingsPage() {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch profile and AI settings in parallel
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, picture, type")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_ai_settings" as never)
      .select(
        "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
      )
      .eq("user_id" as never, user.id)
      .maybeSingle(),
  ]);

  // Cast since generated types may not include the new table yet
  const settingsRow = settings as unknown as {
    active_service: string | null;
    openai_api_key: string | null;
    gemini_api_key: string | null;
    claude_api_key: string | null;
    openai_model: string | null;
    gemini_model: string | null;
    claude_model: string | null;
  } | null;

  // Mask API keys for client
  const clientSettings: UserAiSettingsClient = {
    activeService: (settingsRow?.active_service as AiService) ?? null,
    openaiKeySet: !!settingsRow?.openai_api_key,
    geminiKeySet: !!settingsRow?.gemini_api_key,
    claudeKeySet: !!settingsRow?.claude_api_key,
    openaiModel: settingsRow?.openai_model ?? "gpt-4.1",
    geminiModel: settingsRow?.gemini_model ?? "gemini-2.5-flash",
    claudeModel: settingsRow?.claude_model ?? "claude-sonnet-4-20250514",
  };

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex flex-col flex-1 ml-[220px] min-w-0 overflow-auto">
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        </div>
        <div className="flex-1 px-6 py-8 max-w-lg">
          <SettingsShell settings={clientSettings} />
        </div>
      </main>
    </div>
  );
}
