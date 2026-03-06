import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project, Task, UserType, TabKey, UserProfile } from "@/types/projects";
import Sidebar from "@/components/layout/Sidebar";
import ProjectsList from "./_components/ProjectsList";
import ProjectDetail from "./_components/ProjectDetail";

interface PageProps {
  searchParams: Promise<{ project?: string; tab?: string }>;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", user.id)
    .single();

  const userType = (profile?.type ?? null) as UserType | null;

  // Fetch all profiles for user pickers in modals
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type");
  const profiles = (profilesData ?? []) as unknown as UserProfile[];

  const params = await searchParams;
  const projectId = params.project;
  const tabParam = params.tab as TabKey | undefined;

  // ── Project detail view ────────────────────────────────────────────────────
  if (projectId) {
    const [{ data: projectData }, { data: tasksData }] = await Promise.all([
      supabase
        .from("project")
        .select("id, name, picture, status, stage, program, description, price, referrer_commission, start_date_real, end_date_real, start_date_estimated, end_date_estimated, estimated_time, real_time, authorized_users, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, created_at")
        .eq("id", projectId)
        .single(),
      supabase
        .from("task")
        .select("id, project_id, parent_task_id, name, order, start_date_estimated, end_date_estimated, start_date_real, end_date_real, real_time, estimated_time, type, level, status, task_assignees(user_id, profiles(id, first_name, last_name, picture))")
        .eq("project_id", projectId),
    ]);

    if (!projectData) {
      redirect("/projects");
    }

    const project = projectData as unknown as Project;
    const tasks = (tasksData ?? []) as unknown as Task[];

    const validTabs: TabKey[] = ["stages", "developer", "client_requests", "qa_requests"];
    const initialTab: TabKey = validTabs.includes(tabParam as TabKey) ? (tabParam as TabKey) : "stages";

    return (
      <div className="flex h-screen bg-base overflow-hidden">
        <Sidebar profile={profile} />
        <main className="flex flex-col flex-1 ml-[220px] min-w-0 overflow-hidden">
          <ProjectDetail
            project={project}
            tasks={tasks}
            userType={userType}
            initialTab={initialTab}
            profiles={profiles}
          />
        </main>
      </div>
    );
  }

  // ── Projects list view ─────────────────────────────────────────────────────
  const { data: projectsData } = await supabase
    .from("project")
    .select("id, name, picture, status, stage, program, description, price, referrer_commission, start_date_real, end_date_real, start_date_estimated, end_date_estimated, estimated_time, real_time, authorized_users, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, created_at")
    .order("created_at", { ascending: false });

  const projects = (projectsData ?? []) as unknown as Project[];

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex flex-col flex-1 ml-[220px] min-w-0 overflow-auto">
        {/* Page header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h1 className="text-heading-2 text-text-primary">Projects</h1>
          <span className="text-xs text-text-muted">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
        </div>

        <ProjectsList projects={projects} userType={userType} profiles={profiles} />
      </main>
    </div>
  );
}
