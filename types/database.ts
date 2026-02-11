export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  department: string | null;
  role: 'user' | 'admin' | 'viewer';
  language: 'sv' | 'en';
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  avatar: string;
  age_min: number | null;
  age_max: number | null;
  life_stage: string | null;
  income_level: string | null;
  location: string | null;
  traits: string[];
  goals: string[];
  pain_points: string[];
  interests: string[];
  products_interested: string[];
  digital_maturity: 'low' | 'medium' | 'high';
  channel_preference: string[];
  system_prompt: string | null;
  response_style: 'skeptical' | 'curious' | 'enthusiastic' | 'neutral';
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdAnalysis {
  id: string;
  user_id: string;
  title: string;
  image_url: string | null;
  video_url: string | null;
  ad_copy: string | null;
  channel: string | null;
  brand_fit_score: number | null;
  performance_score: number | null;
  compliance_score: number | null;
  overall_score: number | null;
  heatmap_data: HeatmapPoint[] | null;
  compliance_items: ComplianceItem[] | null;
  ai_suggestions: AISuggestion[] | null;
  persona_feedback: PersonaFeedback[] | null;
  created_at: string;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  label?: string;
}

export interface ComplianceItem {
  status: 'pass' | 'warning' | 'fail';
  category: 'logo' | 'disclaimer' | 'terminology' | 'contrast' | 'legal';
  message: string;
}

export interface AISuggestion {
  type: 'visual' | 'copy' | 'compliance' | 'performance';
  priority: 'high' | 'medium' | 'low';
  message: string;
}

export interface PersonaFeedback {
  personaId: string;
  feedback: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'skeptical';
}

export interface GeneratedCopy {
  id: string;
  user_id: string;
  channel: string;
  objective: string;
  topic: string | null;
  target_market: string;
  headline: string | null;
  subheadline: string | null;
  body_copy: string | null;
  cta: string | null;
  hashtags: string | null;
  brand_fit_score: number | null;
  tone_scores: ToneScores | null;
  is_saved: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface ToneScores {
  humanWarm: number;
  clearSimple: number;
  confidentHumble: number;
  forwardLooking: number;
}

export interface CampaignPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  budget: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  channel_mix: ChannelMixItem[];
  audience: AudienceConfig;
  forecast: CampaignForecast | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelMixItem {
  channelId: string;
  allocation: number;
  customCpm?: number;
}

export interface AudienceConfig {
  size: number;
  geography: string;
  ageMin: number;
  ageMax: number;
  interests: string[];
}

export interface CampaignForecast {
  uniqueReach: number;
  totalImpressions: number;
  totalClicks: number;
  avgFrequency: number;
  estimatedCtr: number;
  avgCpm: number;
  avgCpc: number;
  costPerReach: number;
  reachPercentage: number;
  channelBreakdown: ChannelResult[];
  warnings: string[];
}

export interface ChannelResult {
  channelId: string;
  channelName: string;
  icon: string;
  budget: number;
  impressions: number;
  reach: number;
  clicks: number;
  frequency: number;
  cpm: number;
  ctr: number;
}

export interface Localization {
  id: string;
  user_id: string;
  source_market: string;
  source_content: LocalizationContent;
  target_markets: string[];
  localized_content: Record<string, LocalizedMarketContent> | null;
  created_at: string;
}

export interface LocalizationContent {
  headline: string;
  body: string;
  cta: string;
}

export interface LocalizedMarketContent {
  headline: string;
  body: string;
  cta: string;
  scores: {
    linguistic: number;
    cultural: number;
    legal: number;
  };
  adaptations: Array<{
    type: 'cultural' | 'linguistic' | 'legal' | 'tone';
    original: string;
    adapted: string;
    reason: string;
  }>;
  alternativeHeadlines: Array<{
    text: string;
    confidence: number;
  }>;
}
