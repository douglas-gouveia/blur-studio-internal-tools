# Architecture & Design System

## Design System

### Rationale
The Bubble source app uses centrally-defined named styles (`Text_heading_3_`,
`Button_primary_button_`, `Input_standard_input_`) without exposing hex values.
The design system below is derived from the structural patterns found in
`docs/reference_docs/paginas.md` and `docs/reference_docs/elementos-reutilizaveis.md`:
dark-themed internal tool, sidebar-first layout, tab navigation, modal-centric data entry,
and role-based UI visibility.

---

### Color Palette

All tokens are defined as CSS custom properties in `src/app/globals.css` and
registered with Tailwind v4 via `@theme {}`.

#### Backgrounds

| Token | Hex | Tailwind utility | Usage |
|---|---|---|---|
| `--color-base` | `#0d0d10` | `bg-base` | Page/body background |
| `--color-surface` | `#18181b` | `bg-surface` | Cards, panels, list rows |
| `--color-elevated` | `#1f1f23` | `bg-elevated` | Popovers, dropdown menus |
| `--color-sidebar` | `#111114` | `bg-sidebar` | Left sidebar |
| `--color-muted` | `#27272a` | `bg-muted` | Input backgrounds, row hover |
| `--color-overlay` | `rgba(0,0,0,0.6)` | `bg-overlay` | Modal backdrop |

#### Brand / Accent

| Token | Hex | Tailwind utility | Usage |
|---|---|---|---|
| `--color-accent` | `#3b82f6` | `bg-accent`, `text-accent`, `border-accent` | Primary buttons, active tab indicator, links |
| `--color-accent-hover` | `#2563eb` | `bg-accent-hover` | Button hover state |
| `--color-accent-subtle` | `#1e3a5f` | `bg-accent-subtle` | Selected row background |

#### Text

| Token | Hex | Tailwind utility | Usage |
|---|---|---|---|
| `--color-text-primary` | `#f4f4f5` | `text-primary` | Main body text, headings |
| `--color-text-secondary` | `#a1a1aa` | `text-secondary` | Labels, subtitles, metadata |
| `--color-text-muted` | `#52525b` | `text-muted` | Placeholders, disabled text |
| `--color-text-inverted` | `#0d0d10` | `text-inverted` | Text on accent/light backgrounds |

#### Borders

| Token | Hex | Tailwind utility | Usage |
|---|---|---|---|
| `--color-border` | `#27272a` | `border-default` | Default borders |
| `--color-border-subtle` | `#1f1f23` | `border-subtle` | Dividers between sections |
| `--color-border-focus` | `#3b82f6` | `border-focus` | Input focus ring |

#### Status Semantic Colors

Mapped from Bubble Option Sets: `os_task_status`, `os_project_status`,
`os_internal_project_status`, `os_agreement_status`.

| Status | Hex | Text | Usage |
|---|---|---|---|
| `not_started` | `#52525b` | `#a1a1aa` | Gray — not yet begun |
| `in_progress` | `#1d4ed8` | `#93c5fd` | Blue — actively being worked |
| `ready_for_qa` | `#7e22ce` | `#d8b4fe` | Purple — awaiting review |
| `done` | `#15803d` | `#86efac` | Green — completed |
| `blocked` | `#b91c1c` | `#fca5a5` | Red — blocked / at risk |
| `archived` | `#374151` | `#9ca3af` | Dark gray — archived |
| `prospecting` | `#92400e` | `#fcd34d` | Amber — lead/prospecting |
| `lost_deal` | `#1f2937` | `#6b7280` | Very dark — lost |

---

### Typography

Font: **Geist Sans** (loaded via `next/font/google`, already wired in `layout.tsx`).

| Scale name | Size | Weight | Line-height | Bubble equivalent |
|---|---|---|---|---|
| `heading-1` | 24px | 700 | 1.2 | Page titles |
| `heading-2` | 18px | 600 | 1.3 | Section titles |
| `heading-3` | 14px | 600 | 1.4 | `Text_heading_3_` |
| `body` | 14px | 400 | 1.5 | Default body text |
| `body-small` | 12px | 400 | 1.5 | `Text_body_small_` |
| `label` | 11px | 500 | 1.4 | Form labels, table headers (wide tracking) |

---

### Layout Conventions

| Variable | Value | Usage |
|---|---|---|
| `--sidebar-width` | `220px` | Left sidebar fixed width |
| `--topbar-height` | `0px` | No top bar (sidebar-first pattern) |
| Page padding | `px-6 py-6` | Content area inner spacing |
| Card padding | `p-4` | Standard card inner spacing |
| Section gap | `gap-4` | Space between page sections |

**Z-index scale:**
- `10` — sticky table headers
- `20` — sidebar
- `30` — dropdowns / popovers
- `40` — modal backdrop
- `50` — modal panel

---

### Component Patterns

All patterns use Tailwind v4 utility classes. Custom tokens (e.g. `bg-surface`) are
available globally via the `@theme` block in `globals.css`.

#### Buttons

```html
<!-- Primary (→ Button_primary_button_ in Bubble) -->
<button class="bg-accent hover:bg-accent-hover text-white text-sm font-medium
               px-4 py-2 rounded-md transition-colors">
  Confirm
</button>

<!-- Ghost -->
<button class="text-secondary hover:bg-muted text-sm font-medium
               px-4 py-2 rounded-md transition-colors">
  Cancel
</button>

<!-- Destructive -->
<button class="bg-red-700 hover:bg-red-600 text-white text-sm font-medium
               px-4 py-2 rounded-md transition-colors">
  Delete
</button>

<!-- Icon button -->
<button class="p-2 text-muted hover:text-secondary hover:bg-muted rounded-md transition-colors">
  <!-- icon -->
</button>
```

#### Inputs

```html
<!-- Standard input (→ Input_standard_input_ in Bubble) -->
<input class="w-full bg-muted border border-default rounded-md px-3 py-2
              text-sm text-primary placeholder:text-muted
              focus:outline-none focus:border-focus transition-colors" />

<!-- Textarea -->
<textarea class="w-full bg-muted border border-default rounded-md px-3 py-2
                 text-sm text-primary placeholder:text-muted resize-none
                 focus:outline-none focus:border-focus transition-colors" />
```

#### Cards / Panels

```html
<div class="bg-surface border border-default rounded-lg p-4">
  <!-- content -->
</div>
```

#### Sidebar

```html
<aside class="fixed left-0 top-0 h-screen w-[220px] bg-sidebar border-r border-default
              flex flex-col z-20 overflow-y-auto">
  <!-- logo, nav items -->
</aside>

<!-- Main shell offset -->
<main class="ml-[220px] min-h-screen bg-base px-6 py-6">
  <!-- page content -->
</main>
```

#### Tab Bar

```html
<nav class="flex border-b border-default gap-1">
  <!-- Active tab -->
  <button class="px-4 py-2 text-sm font-medium text-primary
                 border-b-2 border-accent -mb-px">
    Projects
  </button>
  <!-- Inactive tab -->
  <button class="px-4 py-2 text-sm font-medium text-secondary
                 border-b-2 border-transparent -mb-px hover:text-primary">
    Reports
  </button>
</nav>
```

#### Modal / Popup

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-overlay z-40" />
<!-- Panel -->
<div class="fixed inset-0 flex items-center justify-center z-50 p-4">
  <div class="bg-elevated border border-default rounded-xl shadow-2xl
              w-full max-w-lg p-6">
    <!-- header, body, footer -->
  </div>
</div>
```

#### Status Badge

```html
<!-- Compose from status token classes defined in globals.css -->
<span class="status-badge status-in-progress">In Progress</span>
<span class="status-badge status-done">Done</span>
<span class="status-badge status-blocked">Blocked</span>
```

#### Empty State

```html
<!-- → Group Empty Repeating Group in Bubble -->
<div class="flex flex-col items-center justify-center py-16 gap-3 text-muted">
  <!-- optional icon/image -->
  <p class="text-sm">No items found.</p>
</div>
```

---

### Reusable Component Inventory

Mapped from `docs/reference_docs/elementos-reutilizaveis.md`:

| Bubble Element | Next.js component (planned) |
|---|---|
| `FG sidebar` | `src/components/layout/Sidebar.tsx` |
| `Popup delete` | `src/components/ui/ConfirmDeleteModal.tsx` |
| `Popup create/edit project` | `src/components/projects/ProjectModal.tsx` |
| `Popup create/edit task` | `src/components/tasks/TaskModal.tsx` |
| `Popup create/edit agreement` | `src/components/docs/AgreementModal.tsx` |
| `GF task status main` | `src/components/ui/StatusBadge.tsx` |
| `GF project status` | `src/components/ui/StatusBadge.tsx` |
| `Group Empty Repeating Group` | `src/components/ui/EmptyState.tsx` |
| `Group pagination` | `src/components/ui/Pagination.tsx` |
| `Popup loader` | `src/components/ui/Loader.tsx` |
| `offline_banner` | `src/components/ui/OfflineBanner.tsx` |
