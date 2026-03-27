/**
 * Prompts management page — server component.
 * Admin/manager only. Fetches prompt groups with their prompts and renders the shell.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import PromptsShell from "./_components/PromptsShell";
import { getPromptGroups } from "./actions";

export default async function PromptsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", user.id)
    .single();

  // Only admin/manager may access this page
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    redirect("/projects");
  }

  const { data: groups } = await getPromptGroups();

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex flex-col flex-1 ml-[220px] min-w-0 overflow-auto">
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h1 className="text-xl font-bold text-text-primary">Prompts</h1>
        </div>
        <div className="flex-1 px-6 py-8 max-w-4xl">
          <PromptsShell groups={groups ?? []} />
        </div>
      </main>
    </div>
  );
}
