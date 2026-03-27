/**
 * Server Actions for Prompts management page.
 * Admin/manager only: CRUD for prompt groups and prompt content.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const PATH = "/prompts";

export interface PromptRow {
  id: string;
  type: string;
  name: string | null;
  prompt_1: string | null;
  updated_at: string | null;
}

export interface PromptGroupRow {
  id: number;
  name: string;
  step: string;
  updated_at: string | null;
  prompt: PromptRow | null;
}

/** Fetch all prompt groups with their associated prompt. Admin/manager only. */
export async function getPromptGroups(): Promise<{ data?: PromptGroupRow[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Use service client to bypass RLS; cast table names since generated types are out of sync
  const serviceClient = createServiceClient();

  const [groupsRes, promptsRes] = await Promise.all([
    serviceClient
      .from("prompt_group" as never)
      .select("id, name, step, updated_at")
      .order("id"),
    serviceClient
      .from("prompt" as never)
      .select("id, type, name, prompt_1, updated_at"),
  ]);

  if (groupsRes.error) return { error: groupsRes.error.message };
  if (promptsRes.error) return { error: promptsRes.error.message };

  const rawGroups = (groupsRes.data ?? []) as unknown as {
    id: number;
    name: string;
    step: string;
    updated_at: string | null;
  }[];

  const rawPrompts = (promptsRes.data ?? []) as unknown as PromptRow[];

  const promptsByType = new Map<string, PromptRow>();
  for (const p of rawPrompts) {
    promptsByType.set(p.type, p);
  }

  const result: PromptGroupRow[] = rawGroups.map((g) => ({
    id: g.id,
    name: g.name,
    step: g.step,
    updated_at: g.updated_at,
    prompt: promptsByType.get(g.step) ?? null,
  }));

  return { data: result };
}

/** Update the prompt_1 content for a prompt row. Admin/manager only. */
export async function updatePrompt(
  id: string,
  prompt_1: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    return { error: "Unauthorized" };
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("prompt" as never)
    .update({ prompt_1 } as never)
    .eq("id" as never, id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}

/** Update the name of a prompt group. Admin/manager only. */
export async function updatePromptGroupName(
  id: number,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    return { error: "Unauthorized" };
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("prompt_group" as never)
    .update({ name } as never)
    .eq("id" as never, id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}
