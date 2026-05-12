// ── Brief + Campaign types (Sprint 10) ──
//
// CreativeBrief is the output of the strategy wizard or a brief upload.
// It carries strategy inputs (user-supplied) plus AI-derived outputs
// (insight, tension, big_idea, key_messages, value_props). Campaigns link
// a brief to the generated assets.

export type BriefSource = "wizard" | "upload" | "manual";
export type BriefStatus = "draft" | "approved" | "used";

export interface KeyMessage {
  angle: string;
  headline: string;
  rationale: string;
}

export interface ValueProp {
  prop: string;
  evidence: string;
  importance: "primary" | "secondary";
}

export interface Kpi {
  metric: string;
  target: string;
  measurement: string;
}

export interface WizardState {
  current_stage: number;
  total_stages: number;
  answers: Record<string, string>;
  ai_suggestions?: Record<string, unknown>;
}

export interface CreativeBrief {
  id: string;
  source: BriefSource;
  title: string;

  // Strategy inputs
  problem?: string;
  audience_description?: string;
  audience_personas?: string[];
  current_perception?: string;
  desired_action?: string;
  key_message?: string;
  unique_value?: string;

  // AI-generated outputs
  insight?: string;
  tension?: string;
  big_idea?: string;
  key_messages?: KeyMessage[];
  value_props?: ValueProp[];
  tone_of_voice?: string;
  recommended_formats?: string[];
  recommended_channels?: string[];
  recommended_kpis?: Kpi[];

  wizard_state?: WizardState;

  status: BriefStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  brief_id: string | null;

  master_creative_ids: string[];
  template_ids: string[];
  production_job_ids: string[];

  status: "draft" | "in_review" | "approved" | "live";
  approval_notes: string | null;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export type WizardStageId =
  | "problem"
  | "audience"
  | "perception"
  | "message"
  | "action"
  | "review";

export interface WizardStageMeta {
  id: WizardStageId;
  name: string;
}

export const WIZARD_STAGES: WizardStageMeta[] = [
  { id: "problem", name: "Problem" },
  { id: "audience", name: "Målgrupp" },
  { id: "perception", name: "Insikt" },
  { id: "message", name: "Budskap" },
  { id: "action", name: "Handling" },
  { id: "review", name: "Granska" },
];
