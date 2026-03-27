"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ── Sign In ───────────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  let authError: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) authError = error.message;
  } catch {
    return { error: "Unable to reach the server. Please check your connection and try again." };
  }

  if (authError) {
    return { error: authError };
  }

  // Determine where to route based on user type (profiles.type)
  // Bubble signin workflow: referrer → referrer-dashboard, everyone else → projects
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = "/projects";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.type === "referrer") {
      destination = "/referrer-dashboard";
    }
  }

  redirect(destination);
}

// ── Send Password Reset Email ─────────────────────────────────────────────────

export async function sendPasswordReset(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset_pw`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
