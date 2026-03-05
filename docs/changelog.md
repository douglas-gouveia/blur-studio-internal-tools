# Changelog

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] — Description`

---

## [2026-03-05] — Build Step 6: Projects CRUD modals + actions

- Added `ProjectProgram`, `TimeTrack`, `QATimeTrack` types + time helpers to `src/types/projects.ts`
- Created `src/app/projects/actions.ts` — server actions for project, task, time_track, qa_time_track CRUD
- Created modal components in `src/app/projects/_components/modals/`:
  - `Modal.tsx` — base wrapper (Escape, scroll lock, backdrop click)
  - `ConfirmDeleteModal.tsx` — delete confirmation for project or task
  - `ProjectModal.tsx` — create/edit project (all fields + authorized users picker + 4 auto-sync toggles)
  - `TaskModal.tsx` — create/edit task + inline time tracker (date, start/end time dropdowns, auto-calc hours)
  - `WorkingHoursModal.tsx` — project time entries grouped by day, client-side fetch, delete
  - `QATimeTrackerModal.tsx` — QA time entries grouped by milestone, add/delete rows
- Added `.input-field` utility class to `globals.css`
- Wired all buttons in `ProjectsList`, `DeveloperTasks`, `TasksKanban`, `ProjectDetail`
- All tab components receive `profiles` prop from page for user pickers
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 5: Projects page

- Created `src/types/projects.ts`:
  - TypeScript interfaces: `Project`, `Task`, `TaskAssignee`, `UserProfile`
  - Enums: `ProjectStatus`, `TaskStatus`, `TaskType`, `TaskLevel`, `UserType`, `ProjectStage`
  - Constants: `STAGE_LABELS`, `STAGE_ORDER`, `TAB_LABELS`
  - Helpers: `getProgressBadge`, `getVisibleTabs`
- Created `src/components/layout/Sidebar.tsx`:
  - Client Component with `usePathname` active state
  - 10 nav items with inline SVG icons
  - User avatar (picture or initials) at bottom with name + role
- Created `src/app/projects/_components/tabs/StagesChecking.tsx`:
  - Renders all 18 `STAGE_ORDER` stages in order
  - Maps `stages_checking` tasks to stages by name match
  - Falls back to `inferStatus` for stages without tasks
  - `StatusIcon` (checkmark / dot / X / circle)
- Created `src/app/projects/_components/tabs/DeveloperTasks.tsx`:
  - `MilestoneRow` (level_1, expandable) → `TaskRow` (recursive, depth padding)
  - Grid: Name | Status | Start | End | Est(h) | Real(h) | Assignees | Actions
  - Shared cells: `StatusBadge`, `DateCell`, `NumCell`, `Assignees`, `RowActions`
- Created `src/app/projects/_components/tabs/TasksKanban.tsx`:
  - 5-column Kanban (not_started → in_progress → ready_for_qa → done → blocked)
  - Horizontally scrollable, color-coded column top borders
  - `KanbanCard` with assignee avatars + estimated time footer
  - "Track QA Time" button visible for `qa_requests` tab when canEdit
- Created `src/app/projects/_components/ProjectsList.tsx`:
  - Search input + Status filter dropdown
  - Table: # | Name | Status | Start | End | Est(h) | Real(h) | Progress | Users | Actions
  - Progress badge with green/yellow/red color from `getProgressBadge`
  - "+ New Project" button for admin/manager
- Created `src/app/projects/_components/ProjectDetail.tsx`:
  - Breadcrumb (Projects > name) + progress badge
  - "See Working Hours" button
  - Tab bar (role-filtered via `getVisibleTabs`)
  - Renders active tab component
- Created `src/app/projects/page.tsx`:
  - Server Component: fetches user profile + projects list OR project detail + tasks
  - Routes: `/projects` → list; `/projects?project=<id>` → detail; `?tab=<key>` → initial tab
  - Supabase queries with nested `task_assignees(user_id, profiles(...))` select
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 4: signin page + Auth infrastructure

- Installed `@supabase/ssr` for Next.js 15 App Router session cookie management
- Created `src/lib/supabase/server.ts`:
  - `createClient()` — async server-side client (Server Components, Server Actions)
  - `createServiceClient()` — service-role client (bypasses RLS, admin use only)
- Updated `src/lib/supabase/client.ts` — switched to `createBrowserClient` from `@supabase/ssr` for cookie-based session persistence in Client Components
- Created `src/middleware.ts`:
  - Refreshes Supabase session tokens on every request
  - Redirects unauthenticated users to `/signin`
  - Redirects authenticated users away from `/signin` and `/reset_pw`
- Created `src/app/signin/actions.ts`:
  - `signIn` Server Action — email/password login → routes referrer → `/referrer-dashboard`, others → `/projects`
  - `sendPasswordReset` Server Action — sends Supabase password reset email with `/reset_pw` redirect
- Created `src/app/signin/page.tsx`:
  - 3 view states (mirrors Bubble `custom.view_`): `signin`, `reset_password`, `email_sent`
  - Split screen layout: left (light grey + white card), right (indigo branding panel)
  - All forms use `useActionState` for progressive enhancement
  - Logo mark + "Blur Studio" in top-left corner
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 3: API Integrations

- Analyzed `docs/reference_docs/api-connectors.md` (3 connector groups: Brevo, OpenAI, Gemini + Bubble legacy)
- Created `src/lib/api/brevo.ts`:
  - 7 typed email functions: `sendInstructorBookingEmail` (templateId 10), `sendBulkEmailViaTemplate`, `sendAccountDetailsEmail` (templateId 6), `sendPasswordResetEmail`, `sendMagicLinkEmail`, `sendBlankTemplateEmail`, `sendParentPackageBookingEmail`
  - Auth via `BREVO_API_KEY` header; shared `sendEmail` helper handles errors uniformly
- Created `src/lib/api/openai.ts`:
  - `generateOpenAIResponse` — wraps POST `/v1/responses` (Responses API format)
  - `generateOpenAIJsonResponse<T>` — convenience wrapper that parses JSON from output
- Created `src/lib/api/gemini.ts`:
  - `generateGeminiContent` — wraps `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  - `generateGeminiJsonResponse<T>` — sets `response_mime_type: application/json` and parses output
  - Default model: `gemini-2.5-flash`
- Created `src/lib/api/json-converters.ts`:
  - Replaces all Bubble `convert_json_text_into_json_object` calls with local typed JSON parsers
  - `convertStructureAlignJson`, `convertRefiningIcpJson`, `convertStrategicFrameworksJson`, `convertProductDefinitionJson`
  - `verifyTalent` / `verifyClient` stubbed (TODO: Supabase queries) replacing Bubble self-API calls
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 2: Design System

- Updated reference docs (`paginas.md`, `elementos-reutilizaveis.md`) with fresh Bubble exports
- Created `docs/architecture.md` with full Design System documentation:
  - Color palette (8 background tokens, accent, text hierarchy, borders, 8 status semantic colors)
  - Typography scale mapping Bubble named styles (`Text_heading_3_` → `.text-heading-3`, etc.)
  - Component pattern library (Button, Input, Card, Sidebar, Tab bar, Modal, Status badge, Empty state)
  - Reusable component inventory mapping Bubble elements to planned Next.js components
- Updated `src/app/globals.css` (Tailwind v4, CSS `@theme {}` tokens):
  - All design tokens as CSS custom properties
  - Status badge utility classes (`.status-not-started`, `.status-done`, etc.)
  - Typography helper classes
  - Layout shell classes (`.sidebar`, `.page-shell`)
  - Custom scrollbar styling
- Updated `src/app/layout.tsx`: title → "Blur Studio", `<html class="dark">` set

---

## [2026-03-04] — Build Step 1: Database & Privacy

- Analyzed `docs/reference_docs/tabelas.md` (30 data types) and `docs/reference_docs/option-sets.md` (30+ option sets)
- Generated `supabase/migrations/20260304000000_initial_schema.sql` (1 540 lines):
  - **24 PostgreSQL enums** from Bubble Option Sets (os_user_type, os_task_status, os_project_status, os_project_stage, etc.)
  - **39 tables** in correct dependency order (profiles → company/client → sop → project → task → idea…)
  - **3 helper functions** (`get_user_type`, `is_admin_or_manager`, `is_operational_user`) using SECURITY DEFINER
  - **2 triggers** (auto-create profile on sign-up, auto-update `updated_at`)
  - **22 performance indexes** (GIN on UUID[] arrays, FK indexes)
  - **RLS enabled** on all 39 tables
  - **70+ RLS policies** mapping every Bubble Privacy Rule:
    - everyone → default deny
    - admin/manager → full access
    - authorized_users[] → read access for operational users
    - referrer → read own referred projects only
    - created_by → owner full access (idea tables)
    - os_user_type[] arrays → type-based SOP access

---

## [2026-03-04] — Project Setup

- Initialized Next.js 15 app (TypeScript, ESLint, Tailwind CSS, App Router, `src/` directory)
- Created `docs/reference_docs/` and secured Bubble export as source of truth
- Split consolidated documentation into 6 reference files:
  - `tabelas.md` — Data types & privacy rules
  - `option-sets.md` — Enum/option sets
  - `api-connectors.md` — External API integrations (Brevo, OpenAI, Gemini)
  - `paginas.md` — UI pages & workflows
  - `elementos-reutilizaveis.md` — Reusable components
  - `backend-workflows.md` — Server-side workflows
- Created `claude.md` (project memory)
- Initialized git repository
- Created `.gitignore` (env files, Next.js build artifacts)
- Created `.env.example` with placeholders for Supabase, Brevo, OpenAI, Gemini
- Created `docs/changelog.md` and `docs/project_status.md`
