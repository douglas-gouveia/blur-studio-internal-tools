# Project Status

## Phase 1 — Foundation
- [x] Documentation secured in `docs/reference_docs/`
- [x] Next.js app scaffolded
- [x] Git initialized
- [x] `.env.example` created
- [x] `docs/changelog.md` initialized

## Phase 2 — Database
- [ ] Supabase project created & connected
- [x] Enums created from `option-sets.md` (24 enums in migration)
- [x] Tables created from `tabelas.md` (39 tables in migration)
- [x] RLS policies applied from Bubble Privacy Rules (70+ policies in migration)
- [ ] Migration executed in Supabase SQL editor
- [ ] Supabase types generated → `src/lib/supabase/types.ts`

## Phase 3 — Auth
- [x] Supabase Auth configured — `@supabase/ssr` installed, server + browser clients created
- [x] Sign-in page (`signin`) implemented — `src/app/signin/page.tsx` (3 views)
- [x] Password reset flow implemented — `sendPasswordReset` Server Action + `email_sent` confirmation view
- [x] User type routing — `signIn` action routes referrer → `/referrer-dashboard`, others → `/projects`
- [x] Session middleware — `src/middleware.ts` protects all routes, refreshes tokens

## Phase 4 — Core Pages
- [ ] `dashboard`
- [x] `projects`
- [ ] `okrs`
- [ ] `internal-projects`
- [ ] `talent-pool`
- [ ] `talent-profile`
- [ ] `sops`
- [ ] `leads`
- [ ] `feedback`
- [ ] `users`
- [ ] `profile`
- [ ] `docs`
- [x] `sandbox-planner`
- [ ] `recommended-projects`
- [ ] `referrer-dashboard`

## Phase 5 — Reusable Components
- [ ] Sidebar (`FG sidebar`)
- [ ] Popups (create/edit for tasks, projects, goals, KRs, clients, etc.)
- [ ] Group filters (status, assignees, time track, etc.)

## Phase 6 — API Integrations
- [x] Brevo email service — `src/lib/api/brevo.ts` (7 functions, all template calls)
- [x] OpenAI integration — `src/lib/api/openai.ts` (Responses API, JSON helper)
- [x] Gemini integration — `src/lib/api/gemini.ts` (gemini-2.5-flash, JSON helper)
- [x] JSON converters — `src/lib/api/json-converters.ts` (replaces Bubble self-API calls)
- [ ] `verifyTalent` / `verifyClient` — stubbed, needs Supabase query implementation

## Phase 7 — Deployment
- [ ] Vercel project linked
- [ ] GitHub repository created & pushed
- [ ] Environment variables set in Vercel
- [ ] Production deployment verified
