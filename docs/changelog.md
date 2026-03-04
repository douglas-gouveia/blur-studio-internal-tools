# Changelog

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] — Description`

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
