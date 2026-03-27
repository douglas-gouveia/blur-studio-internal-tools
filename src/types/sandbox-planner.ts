/**
 * Types, enums, and labels for the Sandbox Planner feature.
 * Source: supabase/migrations/20260304000000_initial_schema.sql (lines 241-264, 858-956)
 * Maps to Bubble data types: idea, idea_icp, idea_user_type, idea_optimization_suggestion,
 * idea_block_product_definition_and_flows, idea_block_structure_and_align
 */

// ── Enums ────────────────────────────────────────────────────────────────────

/** Maps to PostgreSQL enum os_idea_block */
export type IdeaBlock =
  | "ideas"
  | "structure_align"
  | "refining_icp"
  | "product_definition_flows"
  | "strategic_frameworks";

/** Maps to PostgreSQL enum os_idea_field */
export type IdeaField =
  | "product_overview"
  | "essential_features"
  | "user_flows"
  | "value_proposition"
  | "jtbd_synthesis"
  | "icp_architect"
  | "nabc_pitch"
  | "structure_align"
  | "humanizing_target_audience"
  | "primary_success_metric"
  | "day_in_life"
  | "pain_points_acute_needs";

// ── Labels ───────────────────────────────────────────────────────────────────

/** Human-readable labels for each idea block tab. */
export const IDEA_BLOCK_LABELS: Record<IdeaBlock, string> = {
  ideas: "Ideas",
  structure_align: "Structure & Align",
  refining_icp: "Refining ICP",
  product_definition_flows: "Product Definition & Flows",
  strategic_frameworks: "Strategic Frameworks",
};

/** Step number and subtitle for each block in the wizard flow. */
export const IDEA_BLOCK_STEPS: Record<IdeaBlock, { step: number; subtitle: string }> = {
  ideas: {
    step: 1,
    subtitle: "Select an existing idea or create a new one.",
  },
  structure_align: {
    step: 2,
    subtitle: "AI has extracted key components from your idea. Review and refine them below.",
  },
  refining_icp: {
    step: 3,
    subtitle: "Deep ICP Profiling.",
  },
  product_definition_flows: {
    step: 4,
    subtitle: "Define your product's core features and map out user journeys.",
  },
  strategic_frameworks: {
    step: 5,
    subtitle: "Your Strategic Frameworks. Review the synthesis below.",
  },
};

/** Ordered list of idea blocks for tab rendering. */
export const IDEA_BLOCKS_ORDERED: IdeaBlock[] = [
  "ideas",
  "structure_align",
  "refining_icp",
  "product_definition_flows",
  "strategic_frameworks",
];

// ── Database Row Interfaces ──────────────────────────────────────────────────

/** Represents a row in the `idea` table. */
export interface Idea {
  id: string;
  project_id: string | null;
  created_by: string | null;
  name: string;
  score: number | null;
  description: string | null;
  success_metrics: string | null;
  current_block_ended: IdeaBlock | null;
  current_blocks_updating: string | null;
  created_at: string;
  /** Joined from project table when fetching ideas list */
  project?: { id: string; name: string | null } | null;
}

/** Represents a row in the `idea_icp` table (Ideal Customer Profile). */
export interface IdeaIcp {
  id: string;
  idea_id: string | null;
  name: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  day_in_life: string | null;
  score: number | null;
  picture: string | null;
  tags: string[];
  jtbd: string | null;
  pitch_need: string | null;
  pain_points: string | null;
  firmographics: string | null;
  pitch_benefit: string | null;
  pitch_approach: string | null;
  psychographics: string | null;
  pitch_competition: string | null;
  value_proposition_icp_pains: string | null;
  value_proposition_icp_gains: string | null;
  created_at: string;
}

/** Represents a row in the `idea_user_type` table. */
export interface IdeaUserType {
  id: string;
  idea_id: string | null;
  name: string;
  flows: string | null;
  description: string | null;
  created_at: string;
}

/** Represents a row in the `idea_optimization_suggestion` table. */
export interface IdeaOptimizationSuggestion {
  id: string;
  idea_id: string | null;
  icp_id: string | null;
  name: string | null;
  description: string | null;
  created_at: string;
}

/** Represents a row in the `idea_block_product_definition_and_flows` table. */
export interface IdeaBlockProductDefinition {
  id: string;
  idea_id: string | null;
  created_by: string | null;
  summary: string | null;
  features: string | null;
  created_at: string;
}

/** Represents a row in the `idea_block_structure_and_align` table. */
export interface IdeaBlockStructureAlign {
  id: string;
  idea_id: string | null;
  success_metrics_text: string | null;
  product_overview_text: string | null;
  essential_features_text: string | null;
  success_metrics: string | null;
  target_audience: string | null;
  core_problem: string | null;
  created_at: string;
}

// ── Composite Types ──────────────────────────────────────────────────────────

/** Full idea data with all related entities loaded. Used when viewing an idea's refinement steps. */
export interface IdeaFull {
  idea: Idea;
  structureAlign: IdeaBlockStructureAlign | null;
  icps: IdeaIcp[];
  userTypes: IdeaUserType[];
  productDefinition: IdeaBlockProductDefinition | null;
  optimizationSuggestions: IdeaOptimizationSuggestion[];
}

// ── Helper Types ─────────────────────────────────────────────────────────────

/** Minimal project shape for the project dropdown in Create Idea modal. */
export interface ProjectOption {
  id: string;
  name: string | null;
}
