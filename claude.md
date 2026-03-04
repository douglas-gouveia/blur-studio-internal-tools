# Project Memory — Blur Studio Internal Tools

## Project Goal
Replicate the Bubble.io application documented in `docs/reference_docs/` as a modern web app.

---

## Knowledge Base Mapping

| Domain | Source of Truth |
|--------|----------------|
| **DB** (tables, types, privacy rules) | `docs/reference_docs/tabelas.md` & `docs/reference_docs/option-sets.md` |
| **APIs** (external integrations) | `docs/reference_docs/api-connectors.md` |
| **UI** (pages & layout) | `docs/reference_docs/paginas.md` |
| **Components** (reusable elements) | `docs/reference_docs/elementos-reutilizaveis.md` |
| **Logic** (server-side workflows) | `docs/reference_docs/backend-workflows.md` |
| **Status** | `docs/project_status.md` |

### Primary Reference File
`docs/reference_docs/blurapps-41815--2--documentacao-completa-2026-03-04.md` — master Bubble export, 7,567 lines. All other files are extracted sections of this document.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Version Control**: GitHub

---

## Coding Rules

1. **Consult before coding.** Always read the relevant file in `docs/reference_docs/` before writing any code for a feature.
2. **RLS from Privacy Rules.** Map every Bubble Privacy Rule in `tabelas.md` directly to a Supabase Row Level Security (RLS) Policy. No table ships without RLS.
3. **Changelog discipline.** Update `docs/changelog.md` after every completed step, noting what was built and what changed.
4. **Option Sets → Enums.** Convert Bubble Option Sets (`option-sets.md`) to PostgreSQL enums or Supabase lookup tables — never hardcode strings.
5. **Backend Workflows → Server Actions.** Implement Bubble backend workflows as Next.js Server Actions or Supabase Edge Functions, not client-side logic.
6. **No orphan code.** Every file created must trace back to a documented Bubble element, page, workflow, or data type.
