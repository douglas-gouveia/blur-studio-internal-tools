# Changelog

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] — Description`

---

## [2026-03-28] — Refactor: Restructure prompt tables + redesign Prompts page

- **Migration `20260327100000`**: `prompt_group` — dropped `step` column; `prompt` — added `description` (copied from `prompt_1`), dropped `prompt_1`/`prompt_2`/`prompt_3`, made `group` FK NOT NULL with constraint; data: consolidated 4 prompt_group rows → single "SandBox Planner" row (id=9), all 4 prompts linked to it
- Updated `src/app/prompts/actions.ts` — new data model: `PromptGroupRow` now contains `prompts[]` array (group → many prompts); replaced `updatePrompt(id, prompt_1)` with `updatePromptName(id, name)` + `updatePromptDescription(id, description)`; removed `step` from types; prompts fetched grouped by `group` FK
- Rewrote `src/app/prompts/_components/PromptsShell.tsx` — one card per group showing editable group name; inside the card, each prompt is rendered as a sub-card with editable `name` input and editable `description` textarea; single "Save Prompt" button per prompt saves both fields in parallel
- Updated `src/app/sandbox-planner/actions.ts` — `getPromptTemplate()` now reads `description` column instead of `prompt_1`
- TypeScript: 0 errors

---

## [2026-03-27] — Feature: Prompts DB, Prompts page, breadcrumb nav, step gating, improved AI overlay

- **Migration `20260327000000`**: Added `step` + `updated_at` columns to existing `prompt_group` table; added `prompt_1`, `prompt_2`, `prompt_3`, `name`, `updated_at` columns to `prompt` table; seeded 4 prompt groups and 4 prompt templates with `{{variable}}` placeholder syntax; made `prompt.group` nullable to fix schema drift; RLS + triggers applied
- Updated `src/app/sandbox-planner/actions.ts` — added `getPromptTemplate(step)` helper (reads from `prompt` table via service client bypassing RLS) and `renderPrompt(template, vars)` helper; all 4 generate functions now read prompt from DB with hardcoded fallback constants (`FALLBACK_*`)
- Created `src/app/prompts/page.tsx` — server component; admin/manager guard (redirects to `/projects` otherwise); fetches prompt groups + prompts; renders Sidebar + PromptsShell
- Created `src/app/prompts/actions.ts` — `getPromptGroups()` (parallel fetch groups + prompts, merged in TS), `updatePrompt(id, prompt_1)`, `updatePromptGroupName(id, name)` — all guarded by admin/manager check
- Created `src/app/prompts/_components/PromptsShell.tsx` — accordion cards per group; editable group name + large textarea for prompt_1; variable hints per step; Save buttons with success feedback
- Updated `src/components/layout/Sidebar.tsx` — added `ADMIN_NAV_ITEMS` with conditional Prompts link (visible only to admin/manager); added `IconPrompt` SVG
- Rewrote `src/app/sandbox-planner/_components/SandboxPlannerShell.tsx` — breadcrumb nav with `›` separators replacing pill tabs; active step = white pill, locked = dimmed+disabled; `computeUnlockedSteps(ideaFull)` derives unlock state from data presence (no new DB columns); auto-navigates away from locked step
- Updated `src/app/sandbox-planner/_components/AiLoadingOverlay.tsx` — circle enlarged from `w-16` to `w-24`; sparkle/star SVG icon replacing lightning bolt; text enlarged to `text-xl`; container min-height increased to `min-h-96`
- Updated `src/app/sandbox-planner/_components/RefiningIcpStep.tsx` — added `canSave` guard (both fields + ICP selected); added `useEffect` to sync `selectedIcpId` when `icps` prop changes after AI regeneration
- Updated `src/app/sandbox-planner/_components/ProductDefinitionStep.tsx` — added `canSave` guard (summary + features both non-empty)
- TypeScript: 0 errors

---

## [2026-03-26] — Feature: Settings page, AI multi-provider dispatch, project filtering, AI settings gate

- **Migration `20260326000000`**: Redesigned idea access control — dropped per-table `authorized_users` columns, access now derived from `idea.project.authorized_users` via RLS joins
- **Migration `20260326100000`**: Created `user_ai_settings` table (per-user AI config with RLS, one row per user)
- Created `src/types/settings.ts` — types for AI settings (`AiService`, `UserAiSettingsClient`, `SaveAiSettingsPayload`, model defaults)
- Created `src/lib/api/claude.ts` — Anthropic Claude Messages API client (`generateClaudeResponse`, `generateClaudeJsonResponse`)
- Created `src/lib/api/ai-dispatcher.ts` — thin routing layer (`generateAiJsonResponse`) dispatching to OpenAI, Gemini, or Claude
- Modified `src/lib/api/openai.ts` and `src/lib/api/gemini.ts` — added optional `apiKey` param (fallback to env var)
- Created `src/components/features/AiSettingsForm.tsx` — reusable AI settings form (service selector, per-service API key + model fields)
- Created `src/app/settings/page.tsx` — Settings page server component (auth, profile + AI settings fetch, key masking)
- Created `src/app/settings/actions.ts` — `saveAiSettings` upsert + `getAiSettingsForGeneration` server actions
- Created `src/app/settings/_components/SettingsShell.tsx` — Settings page client wrapper
- Updated `src/components/layout/Sidebar.tsx` — added Settings nav item with gear icon
- Updated `src/app/sandbox-planner/page.tsx` — added `?project=` URL param, AI settings fetch, `hasAiConfigured` computation
- Updated `src/app/sandbox-planner/_components/SandboxPlannerShell.tsx` — passes project filter + AI settings props, preserves `?project=` in navigation
- Rewrote `src/app/sandbox-planner/_components/IdeasGrid.tsx` — URL-based project filtering (all projects in sidebar), AI settings gate on "See Refinement"
- Updated `src/app/sandbox-planner/_components/CreateIdeaModal.tsx` — accepts `defaultProjectId` prop, syncs from URL
- Created `src/app/sandbox-planner/_components/AiSettingsModal.tsx` — popup modal wrapping AiSettingsForm for inline AI configuration
- Updated `src/app/sandbox-planner/actions.ts` — uses `resolveAiConfig` + `generateAiJsonResponse` dispatcher instead of hardcoded OpenAI
- TypeScript: 0 errors

---

## [2026-03-24] — Build: Sandbox Planner page (5-step AI wizard)

- Created `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- Created `src/types/sandbox-planner.ts` — types, enums, labels for all idea entities (`Idea`, `IdeaIcp`, `IdeaUserType`, `IdeaOptimizationSuggestion`, `IdeaBlockProductDefinition`, `IdeaBlockStructureAlign`, `IdeaFull`)
- Updated `src/components/layout/Sidebar.tsx` — added "Sandbox Planner" nav item with lightbulb icon
- Created `src/app/sandbox-planner/page.tsx` — server component with auth, parallel data fetching, full idea hydration
- Created `src/app/sandbox-planner/actions.ts` — 15 server actions (CRUD for ideas, ICPs, user types, optimization suggestions + AI generation triggers using OpenAI gpt-4.1)
- Created `src/app/sandbox-planner/_components/`:
  - `SandboxPlannerShell.tsx` — client shell with tab navigation, URL-synced state, Supabase realtime subscription for AI polling
  - `IdeasGrid.tsx` — Step 1: idea cards grid with project filter sidebar, empty state
  - `CreateIdeaModal.tsx` — create idea form (name*, description*, project dropdown) with early validation and submit state
  - `StructureAlignStep.tsx` — Step 2: editable Core Problem, Target Audience, Success Metrics with AI regeneration
  - `AiLoadingOverlay.tsx` — AI spinner overlay with animated icon and auto-dismissing success banner
  - `IcpPillSelector.tsx` — selectable ICP persona pills with optional completion badges
  - `RefiningIcpStep.tsx` — Step 3: per-ICP Day in Life + Pain Points editing with instructions panel
  - `RichTextEditor.tsx` — TipTap wrapper with formatting toolbar (Bold, Italic, Underline, Headings, Lists, Code)
  - `ProductDefinitionStep.tsx` — Step 4: rich text product summary, features display, user type flow pills
  - `StrategicFrameworksStep.tsx` — Step 5: Value Proposition, JTBD, ICP Architect, NABC Pitch cards + optimization suggestions
- TypeScript: 0 errors

---

## [2026-03-14] — Fix: Date picker, kanban ordering, cascade updates, performance, project popup

- **DatePicker**: Added Delete/Backspace keyboard shortcut to clear selected date value
- **Developer Tasks dates**: Start/End Date inputs now use calendar DatePicker with auto-binding to database
- **Kanban drag-and-drop**: Fixed card ordering using fractional values (NUMERIC column) — cards now correctly stay between, at first, or at last position using formulas: between=(above+below)/2, first=first_order-1, last=last_order+1. Fixed stale drop target via ref-based tracking
- **Estimated time cascade**: When client/qa milestone totals are updated, milestone.estimated_time now includes dev tasks + client_total + qa_dev_total + qa_qa_total. Cascades to project.estimated_time when automation flags are TRUE
- **Real time cascade**: time_track updates cascade through task → client/qa_milestone_total → milestone → project, respecting new automation flags (change_automatically_milestone_real_time, change_automatically_project_real_time)
- **qa_time_track cascade**: qa_time_track.time_spent_h updates cascade to qa_milestone_total.qa_real_time_h → milestone.real_time → project.real_time
- **Performance**: Task deletion and creation optimized with parallel batch operations instead of sequential queries
- **Project popup**: Project name in breadcrumb is now clickable to open the ProjectModal
- **DB migration**: `task.order` changed from INTEGER to NUMERIC; added `change_automatically_milestone_real_time` and `change_automatically_project_real_time` columns to project table

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
