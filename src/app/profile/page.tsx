import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import ProfileForm from "./_components/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, country")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex flex-col flex-1 ml-[220px] min-w-0 overflow-auto">
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h1 className="text-heading-2 text-text-primary">Profile</h1>
        </div>
        <div className="flex-1 px-6 py-8 max-w-lg">
          <ProfileForm
            profile={{
              first_name: profile?.first_name ?? "",
              last_name:  profile?.last_name  ?? "",
              picture:    profile?.picture    ?? "",
              country:    profile?.country    ?? "",
              email:      user.email          ?? "",
            }}
          />
        </div>
      </main>
    </div>
  );
}
