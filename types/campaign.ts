export type CampaignStatus = 'draft' | 'in_review' | 'approved' | 'exported';

export type CampaignStep =
  | 'brief'
  | 'concept'
  | 'material'
  | 'persona-test'
  | 'compliance'
  | 'export';

export const CAMPAIGN_STEPS: CampaignStep[] = [
  'brief',
  'concept',
  'material',
  'persona-test',
  'compliance',
  'export',
];

export const STEP_LABELS: Record<CampaignStep, string> = {
  brief: 'Brief',
  concept: 'Koncept',
  material: 'Material',
  'persona-test': 'Persona-test',
  compliance: 'Compliance',
  export: 'Export',
};

export type ChannelKey = 'meta' | 'tiktok' | 'display' | 'email' | 'linkedin' | 'youtube';
export type ObjectiveKey = 'awareness' | 'consideration' | 'conversion' | 'retention';

export interface Brief {
  name: string;
  objective: ObjectiveKey | '';
  product: string;
  audience: string;
  channels: ChannelKey[];
  targetPersonaIds: string[];
  budget: number;
  deadline: string;
  notes: string;
}

export interface Concept {
  id: string;
  angle: string;
  headline: string;
  subheadline?: string;
  bodyCopy: string;
  cta: string;
  hashtags?: string | null;
  brandFitScore?: number;
}

export interface CreativeAsset {
  id: string;
  type: 'video' | 'image';
  format: string;
  url?: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface PersonaReaction {
  personaId: string;
  personaName: string;
  personaAvatar: string;
  firstImpression: string;
  wouldClick: number;
  objections: string[];
}

export interface ComplianceFlag {
  severity: 'high' | 'medium' | 'low';
  field: string;
  issue: string;
  suggestion: string;
}

export interface Campaign {
  id: string;
  status: CampaignStatus;
  currentStep: CampaignStep;
  completedSteps: CampaignStep[];
  brief: Brief;
  concepts: Concept[];
  selectedConceptId: string | null;
  creatives: CreativeAsset[];
  personaReactions: PersonaReaction[];
  complianceFlags: ComplianceFlag[];
  complianceScore: number | null;
  approvedBy: string | null;
  approvedAt: string | null;
  localizedMarkets: string[];
  createdAt: string;
  updatedAt: string;
}

export function createEmptyCampaign(): Campaign {
  const now = new Date().toISOString();
  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'draft',
    currentStep: 'brief',
    completedSteps: [],
    brief: {
      name: '',
      objective: '',
      product: '',
      audience: '',
      channels: [],
      targetPersonaIds: [],
      budget: 0,
      deadline: '',
      notes: '',
    },
    concepts: [],
    selectedConceptId: null,
    creatives: [],
    personaReactions: [],
    complianceFlags: [],
    complianceScore: null,
    approvedBy: null,
    approvedAt: null,
    localizedMarkets: [],
    createdAt: now,
    updatedAt: now,
  };
}
