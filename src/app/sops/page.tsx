import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SopWithTags, SopTag, SopVersion } from "@/types/sops";
import type { UserProfile } from "@/types/projects";
import Sidebar from "@/components/layout/Sidebar";
import SopList from "./_components/SopList";
import SopEditor from "./_components/SopEditor";

interface Props {
  searchParams: Promise<{ sop?: string }>;
}

export default async function SopsPage({ searchParams }: Props) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", user.id)
    .single();

  // Only admin and manager can manage SOPs; others can view
  // (access filter is applied in RLS — page is accessible to all authenticated users)

  // Fetch all SOPs with tags
  const { data: sopsRaw } = await supabase
    .from("sop")
    .select("id, name, order, authorized_users, authorized_user_types, created_at, sop_tags(sop_tag_id, sop_tag:sop_tag_id(id, name))")
    .order("order", { ascending: true });

  const sops: SopWithTags[] = (sopsRaw ?? []).map((s: any) => ({
    id:                    s.id,
    name:                  s.name,
    order:                 s.order,
    authorized_users:      s.authorized_users ?? [],
    authorized_user_types: s.authorized_user_types ?? [],
    created_at:            s.created_at,
    tags:                  (s.sop_tags ?? [])
      .map((st: any) => st.sop_tag)
      .filter(Boolean) as SopTag[],
  }));

  // Fetch all tags (for SopModal)
  const { data: allTagsRaw } = await supabase
    .from("sop_tag")
    .select("id, name")
    .order("name", { ascending: true });
  const allTags: SopTag[] = (allTagsRaw ?? []) as SopTag[];

  // Fetch all profiles (for SopModal authorized users)
  const { data: profilesRaw } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .order("first_name", { ascending: true });
  const profiles: UserProfile[] = (profilesRaw ?? []) as UserProfile[];

  // Resolve active SOP from query param
  const { sop: activeSopId } = await searchParams;
  const activeSop = activeSopId ? sops.find((s) => s.id === activeSopId) ?? null : null;

  // Fetch versions for active SOP
  let versions: SopVersion[] = [];
  if (activeSop) {
    const { data: versionsRaw } = await supabase
      .from("sop_version")
      .select("id, sop_id, version_name, content, created_at")
      .eq("sop_id", activeSop.id)
      .order("created_at", { ascending: false });
    versions = (versionsRaw ?? []) as SopVersion[];
  }

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar profile={profile} />

      {/* 3-column layout */}
      <div className="flex flex-1 ml-[220px] min-w-0 overflow-hidden">
        {/* Documents panel */}
        <div className="w-[260px] shrink-0 flex flex-col overflow-hidden">
          <SopList
            sops={sops}
            allTags={allTags}
            profiles={profiles}
            activeSopId={activeSopId ?? null}
          />
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {activeSop ? (
            <SopEditor
              sop={activeSop}
              versions={versions}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-sm">
              <div className="text-center">
                <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p>Select a document to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
