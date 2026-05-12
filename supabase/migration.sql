-- Nordea CreativeIQ - Supabase Migration
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT DEFAULT 'Marketing',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'viewer')),
  language TEXT DEFAULT 'sv' CHECK (language IN ('sv', 'en')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PERSONAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT DEFAULT '👤',
  age_min INTEGER,
  age_max INTEGER,
  life_stage TEXT,
  income_level TEXT,
  location TEXT,
  traits TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  pain_points TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  products_interested TEXT[] DEFAULT '{}',
  digital_maturity TEXT DEFAULT 'medium' CHECK (digital_maturity IN ('low', 'medium', 'high')),
  channel_preference TEXT[] DEFAULT '{}',
  system_prompt TEXT,
  response_style TEXT DEFAULT 'neutral' CHECK (response_style IN ('skeptical', 'curious', 'enthusiastic', 'neutral')),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AD ANALYSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.ad_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  ad_copy TEXT,
  channel TEXT,
  brand_fit_score INTEGER,
  performance_score INTEGER,
  compliance_score INTEGER,
  overall_score INTEGER,
  heatmap_data JSONB,
  compliance_items JSONB,
  ai_suggestions JSONB,
  persona_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GENERATED COPIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.generated_copies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL,
  objective TEXT NOT NULL,
  topic TEXT,
  target_market TEXT DEFAULT 'SE',
  headline TEXT,
  subheadline TEXT,
  body_copy TEXT,
  cta TEXT,
  hashtags TEXT,
  brand_fit_score INTEGER,
  tone_scores JSONB,
  is_saved BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAMPAIGN PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS public.campaign_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  budget NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SEK',
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  channel_mix JSONB DEFAULT '[]',
  audience JSONB DEFAULT '{}',
  forecast JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCALIZATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.localizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_market TEXT NOT NULL,
  source_content JSONB NOT NULL,
  target_markets TEXT[] DEFAULT '{}',
  localized_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Personas (default personas visible to all, custom ones to owner)
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view default personas"
  ON public.personas FOR SELECT
  USING (is_default = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create personas"
  ON public.personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas"
  ON public.personas FOR UPDATE
  USING (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "Users can delete own personas"
  ON public.personas FOR DELETE
  USING (auth.uid() = user_id AND is_default = FALSE);

-- Ad Analyses
ALTER TABLE public.ad_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.ad_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create analyses"
  ON public.ad_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Generated Copies
ALTER TABLE public.generated_copies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own copies"
  ON public.generated_copies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create copies"
  ON public.generated_copies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own copies"
  ON public.generated_copies FOR UPDATE
  USING (auth.uid() = user_id);

-- Campaign Plans
ALTER TABLE public.campaign_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON public.campaign_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create campaigns"
  ON public.campaign_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON public.campaign_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON public.campaign_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Localizations
ALTER TABLE public.localizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own localizations"
  ON public.localizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create localizations"
  ON public.localizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEED: Default Personas
-- ============================================
INSERT INTO public.personas (name, description, avatar, age_min, age_max, life_stage, income_level, location, traits, goals, pain_points, interests, products_interested, digital_maturity, channel_preference, system_prompt, response_style, is_default, is_active)
VALUES
(
  'Ung Förstagångsköpare',
  'Millennial eller Gen Z som drömmer om sin första bostad. Digital, researchar mycket online, osäker på processen.',
  '🏠', 25, 35, 'young_professional', 'medium', 'urban',
  ARRAY['Digital native', 'Researchar mycket', 'Priskänslig', 'Vill ha transparens', 'Osäker på processen'],
  ARRAY['Köpa första bostaden', 'Förstå bolåneprocessen', 'Hitta bästa räntan', 'Bygga upp eget kapital'],
  ARRAY['Svårt att förstå alla steg', 'Rädd att göra fel', 'Kontantinsatsen är hög', 'Osäker på hur mycket jag har råd med'],
  ARRAY['Bostad', 'Privatekonomi', 'Sparande', 'Hållbarhet'],
  ARRAY['Bolån', 'Sparkonto', 'ISK'],
  'high', ARRAY['app', 'web'],
  'Du är en 28-årig person som funderar på att köpa din första bostad. Du är digital och gör mycket research online innan du fattar beslut. Du är lite skeptisk till banker och vill ha tydlig, ärlig information utan säljtryck. Du ställer kritiska frågor om kostnader och villkor. Du uppskattar när saker förklaras enkelt utan bankjargong.',
  'curious', TRUE, TRUE
),
(
  'Spararen',
  'Intresserad av att få pengarna att växa. Jämför alternativ, läser på om fonder och sparformer.',
  '💰', 30, 50, 'family', 'medium', 'suburban',
  ARRAY['Jämför alternativ', 'Långsiktig', 'Riskavert', 'Vill förstå avgifter', 'Läser på'],
  ARRAY['Bygga buffert', 'Spara till pension', 'Få bra avkastning', 'Förstå skillnaden mellan sparformer'],
  ARRAY['Svårt att välja bland alla alternativ', 'Orolig för dolda avgifter', 'Osäker på risk', 'Vet inte hur mycket jag borde spara'],
  ARRAY['Sparande', 'Fonder', 'Pension', 'Privatekonomi'],
  ARRAY['Sparkonto', 'Fonder', 'ISK', 'Pensionssparande'],
  'medium', ARRAY['web', 'app'],
  'Du är en 42-åring som vill få bättre koll på ditt sparande. Du har pengar på ett vanligt sparkonto men undrar om du borde göra något smartare. Du är inte superintresserad av aktier och vill inte ta för stora risker, men du vill att pengarna ska växa mer än de gör idag. Du ställer frågor om avgifter, risk och vad som faktiskt är bäst för dig.',
  'neutral', TRUE, TRUE
),
(
  'Familjeföräldern',
  'Småbarnsförälder med fullt upp. Vill ha ordning på ekonomin, spara till barnen, och ha trygghet.',
  '👨‍👩‍👧‍👦', 32, 45, 'family', 'medium', 'suburban',
  ARRAY['Tidspressad', 'Prioriterar familjen', 'Vill ha trygghet', 'Praktisk', 'Letar efter enkelhet'],
  ARRAY['Spara till barnens framtid', 'Ha ekonomisk buffert', 'Försäkra familjen', 'Betala av bolånet'],
  ARRAY['Har inte tid att sätta mig in i allt', 'Orolig att missa något viktigt', 'Svårt att prioritera bland alla utgifter', 'Vill inte göra fel val för barnens skull'],
  ARRAY['Familj', 'Barnsparande', 'Försäkring', 'Bostad'],
  ARRAY['Barnsparande', 'Bolån', 'Försäkringar', 'Sparkonto'],
  'medium', ARRAY['app', 'web'],
  'Du är en 38-årig förälder till två barn (5 och 8 år). Du har fullt upp med jobb och familj och har inte mycket tid att lägga på ekonomi, men du vill göra rätt för barnens skull. Du vill ha enkla lösningar som inte kräver att du följer med hela tiden. Du uppskattar när banken gör det lätt för dig och inte kräver att du är expert.',
  'neutral', TRUE, TRUE
),
(
  'Pensionsspararen',
  'Närmar sig pension och börjar fundera på vad som händer sen. Vill ha trygghet och koll.',
  '🌅', 55, 67, 'pre_retirement', 'high', 'suburban',
  ARRAY['Trygghetsfokuserad', 'Långsiktig', 'Värdesätter personlig kontakt', 'Vill ha kontroll', 'Skeptisk till digitala lösningar'],
  ARRAY['Förstå min pension', 'Veta att pengarna räcker', 'Planera för ett bra liv efter jobbet', 'Inte ta onödiga risker'],
  ARRAY['Osäker på om jag sparat tillräckligt', 'Pensionssystemet är förvirrande', 'Vill inte förlora det jag byggt upp', 'Saknar personlig rådgivning'],
  ARRAY['Pension', 'Trygghet', 'Ekonomisk planering', 'Hälsa'],
  ARRAY['Pensionssparande', 'Fonder', 'Rådgivning', 'Försäkringar'],
  'low', ARRAY['phone', 'branch', 'web'],
  'Du är 60 år och har jobbat hela livet. Nu börjar du fundera på pensionen - räcker pengarna? Hur fungerar det egentligen? Du har sparat en del men är osäker på om det är rätt placerat. Du föredrar att prata med en riktig person snarare än att klicka runt i en app. Du vill ha tydliga besked, inte massa alternativ att välja mellan.',
  'skeptical', TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================
-- TEMPLATES (Sprint 3 — Mallbibliotek)
-- ============================================
-- user_id is intentionally TEXT (not UUID + auth.users FK) per
-- CREATIVEIQ-ROADMAP.md Sprint 3 spec. RBAC + RLS hardening
-- is scoped to Sprint 11 (Enterprise Prep).
--
-- `config` stores the full Motion Studio VideoConfig JSON (lib/remotion/types).
-- Storing it verbatim means the render pipeline can re-render templates
-- without any field-name translation.
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  config JSONB NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row update
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS templates_touch_updated_at ON public.templates;
CREATE TRIGGER templates_touch_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- PRODUCTION JOBS (Sprint 3 — Bulk Production)
-- ============================================
CREATE TABLE IF NOT EXISTS public.production_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  variants JSONB NOT NULL DEFAULT '{"headlines":[],"bodies":[],"ctas":[]}',
  formats TEXT[] NOT NULL DEFAULT ARRAY['story'],
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_videos INTEGER NOT NULL DEFAULT 0,
  completed_videos INTEGER NOT NULL DEFAULT 0,
  output_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  zip_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- QA RUNS (Sprint 5 — Persona-driven QA Gate)
-- ============================================
-- One row per QA invocation. The four checks run in parallel and their
-- results land in the *_results JSONB columns. status drives the export
-- block in the UI: 'fail' = export disabled, 'warn' = reviewer approval,
-- 'pass' = open. Like Sprint 3 user_id is TEXT (RLS comes in Sprint 11).
CREATE TABLE IF NOT EXISTS public.qa_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  creative_kind TEXT NOT NULL CHECK (creative_kind IN ('video', 'banner', 'copy', 'template')),
  creative_ref TEXT NOT NULL,
  creative_metadata JSONB,
  persona_score NUMERIC,
  tov_score NUMERIC,
  compliance_score NUMERIC,
  heatmap_score NUMERIC,
  total_score NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail', 'running', 'error')),
  persona_results JSONB DEFAULT '{}'::jsonb,
  tov_results JSONB DEFAULT '{}'::jsonb,
  compliance_results JSONB DEFAULT '{}'::jsonb,
  heatmap_results JSONB DEFAULT '{}'::jsonb,
  blocking_issues JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_note TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- QA THRESHOLDS (per product category)
-- ============================================
-- The code-level constants in lib/qa/thresholds.ts are the source of truth
-- for now; this table is the future hook for per-product overrides without
-- redeploys. Seeded with the same defaults used in code.
CREATE TABLE IF NOT EXISTS public.qa_thresholds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_type TEXT NOT NULL UNIQUE,
  pass_threshold NUMERIC DEFAULT 80,
  warn_threshold NUMERIC DEFAULT 70,
  persona_weight NUMERIC DEFAULT 0.35,
  tov_weight NUMERIC DEFAULT 0.20,
  compliance_weight NUMERIC DEFAULT 0.30,
  heatmap_weight NUMERIC DEFAULT 0.15,
  required_disclaimers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.qa_thresholds (product_type, required_disclaimers) VALUES
  ('general', '[]'::jsonb),
  ('mortgage', '["effective_interest_rate", "amortization_info"]'::jsonb),
  ('savings', '["risk_warning", "past_performance_disclaimer"]'::jsonb),
  ('loans', '["effective_interest_rate", "total_cost"]'::jsonb),
  ('pension', '["risk_warning"]'::jsonb),
  ('insurance', '["coverage_terms"]'::jsonb),
  ('cards', '["interest_rate", "annual_fee"]'::jsonb),
  ('business', '[]'::jsonb)
ON CONFLICT (product_type) DO NOTHING;

-- ============================================
-- AI GENERATIONS (Sprint 6 — Provider layer)
-- ============================================
-- One row per provider call (video/image gen, stock search). Used for:
--   1. Cost tracking — sum cost_usd per user_id over the period
--   2. Cache — query by cache_key for dedup hits
--   3. Audit — what was generated when, with what prompt
-- Stubbed external-provider attempts also land here with status='stubbed'
-- so we can show "N stubbed calls — pending approval" in the UI.
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('video', 'image', 'stock-search')),
  provider TEXT NOT NULL,
  model TEXT,
  prompt TEXT,
  params JSONB DEFAULT '{}'::jsonb,
  result_url TEXT,
  thumbnail_url TEXT,
  cache_key TEXT,
  cache_hit BOOLEAN DEFAULT FALSE,
  cost_usd NUMERIC DEFAULT 0,
  cost_currency TEXT DEFAULT 'USD',
  latency_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'cached', 'stubbed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER CREDITS (Sprint 6 — monthly budget tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id TEXT PRIMARY KEY,
  monthly_budget_usd NUMERIC DEFAULT 100,
  current_period_spend_usd NUMERIC DEFAULT 0,
  period_start DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ad_analyses_user_id ON public.ad_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_analyses_created_at ON public.ad_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_copies_user_id ON public.generated_copies(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_plans_user_id ON public.campaign_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_is_default ON public.personas(is_default);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_updated_at ON public.templates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_favorite ON public.templates(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_production_jobs_user_id ON public.production_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON public.production_jobs(status);
CREATE INDEX IF NOT EXISTS idx_production_jobs_created_at ON public.production_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_jobs_template ON public.production_jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_qa_runs_user_id ON public.qa_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_runs_status ON public.qa_runs(status);
CREATE INDEX IF NOT EXISTS idx_qa_runs_creative ON public.qa_runs(creative_kind, creative_ref);
CREATE INDEX IF NOT EXISTS idx_qa_runs_created_at ON public.qa_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_gen_user ON public.ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_cache ON public.ai_generations(cache_key) WHERE cache_hit = FALSE AND status = 'success';
CREATE INDEX IF NOT EXISTS idx_ai_gen_provider ON public.ai_generations(provider);
CREATE INDEX IF NOT EXISTS idx_ai_gen_created_at ON public.ai_generations(created_at DESC);

-- ============================================================================
-- SPRINT 9: MASTER CREATIVES
-- ============================================================================
-- A "Master Creative" is one designed VideoConfig that gets auto-projected
-- to all four formats (Story/Feed/Landscape/Vertical) via brand safe zones,
-- with optional per-format manual overrides stored in format_overrides.

CREATE TABLE IF NOT EXISTS public.master_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_format TEXT NOT NULL,
  master_config JSONB NOT NULL,
  format_overrides JSONB DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL DEFAULT 'default-user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_creatives_user ON public.master_creatives(created_by);
CREATE INDEX IF NOT EXISTS idx_master_creatives_updated ON public.master_creatives(updated_at DESC);

-- ============================================================================
-- SPRINT 10: BRIEFS + CAMPAIGNS
-- ============================================================================
-- Creative briefs are the output of the strategy wizard or an upload. They
-- carry strategy inputs (user-supplied) + AI-generated outputs (insight,
-- tension, big_idea, key_messages, value_props). Campaigns link a brief to
-- the generated assets (master_creatives + templates + production_jobs).

CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  source TEXT NOT NULL,  -- 'wizard' | 'upload' | 'manual'

  title TEXT NOT NULL,

  -- Strategy inputs (from wizard)
  problem TEXT,
  audience_description TEXT,
  audience_personas TEXT[],
  current_perception TEXT,
  desired_action TEXT,
  key_message TEXT,
  unique_value TEXT,

  -- AI-generated outputs
  insight TEXT,
  tension TEXT,
  big_idea TEXT,
  key_messages JSONB DEFAULT '[]'::jsonb,
  value_props JSONB DEFAULT '[]'::jsonb,
  tone_of_voice TEXT,
  recommended_formats TEXT[],
  recommended_channels TEXT[],
  recommended_kpis JSONB DEFAULT '[]'::jsonb,

  wizard_state JSONB DEFAULT '{}'::jsonb,

  status TEXT DEFAULT 'draft',  -- 'draft' | 'approved' | 'used'
  created_by TEXT NOT NULL DEFAULT 'default-user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefs_status ON public.creative_briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_user ON public.creative_briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_briefs_updated ON public.creative_briefs(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE SET NULL,

  master_creative_ids UUID[],
  template_ids UUID[],
  production_job_ids UUID[],

  status TEXT DEFAULT 'draft',  -- 'draft' | 'in_review' | 'approved' | 'live'
  approval_notes TEXT,

  created_by TEXT NOT NULL DEFAULT 'default-user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_brief ON public.campaigns(brief_id);
