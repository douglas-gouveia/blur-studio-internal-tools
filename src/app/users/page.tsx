import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { UserRow, UserType } from "@/types/projects";
import Sidebar from "@/components/layout/Sidebar";
import UsersList from "./_components/UsersList";

export default async function UsersPage() {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch current user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", user.id)
    .single();

  // Only admin and manager can access this page
  if (profile?.type !== "admin" && profile?.type !== "manager") {
    redirect("/projects");
  }

  // Fetch all profiles
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, country, created_at")
    .order("created_at", { ascending: true });

  // Fetch all auth users to get emails (requires service role)
  const admin = createServiceClient();
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  // Merge profiles with emails
  const users: UserRow[] = (profilesData ?? []).map((p) => ({
    id:         p.id,
    first_name: p.first_name,
    last_name:  p.last_name,
    picture:    p.picture,
    type:       (p.type ?? null) as UserType | null,
    country:    p.country ?? null,
    created_at: p.created_at,
    email:      emailMap.get(p.id) ?? "",
  }));

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex flex-col flex-1 ml-[220px] min-w-0 overflow-auto">
        {/* Page header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h1 className="text-heading-2 text-text-primary">Users</h1>
          <span className="text-xs text-text-muted">{users.length} user{users.length !== 1 ? "s" : ""}</span>
        </div>

        <UsersList users={users} />
      </main>
    </div>
  );
}
