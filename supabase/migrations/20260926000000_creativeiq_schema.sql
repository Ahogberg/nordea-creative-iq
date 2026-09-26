-- ============================================================================
-- Nordea CreativeIQ — databasschema
-- ============================================================================
-- Ersätter supabase/migration.sql + supabase/rls_sprint12.sql för nya
-- projekt. Skillnader mot de gamla filerna:
--  - gen_random_uuid() (inbyggd) i stället för uuid-ossp
--  - radnivåsäkerhet (RLS) på ALLA tabeller, mot rätt ägarkolumn per tabell
--    (rls_sprint12.sql pekade på kolumner som inte finns)
--  - ägarkolumnerna har ingen standard 'default-user' längre — API:et sätter
--    den inloggade användarens id (eller 'demo' i demoläget, via servernyckeln)
--  - en kampanj per brief (unikt index på campaigns.brief_id)
--  - triggerfunktioner med låst search_path
--
-- Ägarkolumner (TEXT, auth.uid()::text):
--   templates.user_id, production_jobs.user_id, qa_runs.user_id,
--   ai_generations.user_id, user_credits.user_id,
--   master_creatives.created_by, creative_briefs.created_by, campaigns.created_by
-- Tabellerna från första versionen (profiles, personas, ad_analyses,
-- generated_copies, campaign_plans, localizations) har user_id UUID mot auth.users.

-- ── Hjälpfunktioner ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── Profiler (utökar auth.users) ────────────────────────────────────────────

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggerfunktionerna ska inte gå att anropa via API:et.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- ── Personas ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- ── Första versionens verktyg ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ad_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.generated_copies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.campaign_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.localizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_market TEXT NOT NULL,
  source_content JSONB NOT NULL,
  target_markets TEXT[] DEFAULT '{}',
  localized_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Mallar och produktion ───────────────────────────────────────────────────

-- config = hela Motion Studio-konfigurationen (lib/remotion/types VideoConfig).
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

DROP TRIGGER IF EXISTS templates_touch_updated_at ON public.templates;
CREATE TRIGGER templates_touch_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.production_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- ── QA ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.qa_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.qa_thresholds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- ── AI-anrop och budget ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('video', 'image', 'stock-search', 'text')),
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

CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id TEXT PRIMARY KEY,
  monthly_budget_usd NUMERIC DEFAULT 100,
  current_period_spend_usd NUMERIC DEFAULT 0,
  period_start DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Master creatives, briefer, kampanjer ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.master_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_format TEXT NOT NULL,
  master_config JSONB NOT NULL,
  format_overrides JSONB DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,  -- 'wizard' | 'upload' | 'manual'
  title TEXT NOT NULL,
  problem TEXT,
  audience_description TEXT,
  audience_personas TEXT[],
  current_perception TEXT,
  desired_action TEXT,
  key_message TEXT,
  unique_value TEXT,
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
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE SET NULL,
  master_creative_ids UUID[],
  template_ids UUID[],
  production_job_ids UUID[],
  status TEXT DEFAULT 'draft',  -- 'draft' | 'in_review' | 'approved' | 'live'
  approval_notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_personas_is_default ON public.personas(is_default);
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON public.personas(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_analyses_user_id ON public.ad_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_analyses_created_at ON public.ad_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_copies_user_id ON public.generated_copies(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_plans_user_id ON public.campaign_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_localizations_user_id ON public.localizations(user_id);
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
CREATE INDEX IF NOT EXISTS idx_master_creatives_user ON public.master_creatives(created_by);
CREATE INDEX IF NOT EXISTS idx_master_creatives_updated ON public.master_creatives(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON public.creative_briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_user ON public.creative_briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_briefs_updated ON public.creative_briefs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(created_by);
-- En kampanj per brief: kampanjsidan skapade tidigare en ny vid varje besök.
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_brief_unique ON public.campaigns(brief_id) WHERE brief_id IS NOT NULL;

-- ── Radnivåsäkerhet ─────────────────────────────────────────────────────────
-- Inloggade användare ser och ändrar bara sina egna rader. Servernyckeln
-- (demoläget och bakgrundsjobb) går förbi RLS — API:et filtrerar då på ägare.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Egen profil läses" ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);
CREATE POLICY "Egen profil ändras" ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

-- Standardpersonas syns för alla (även gränssnittet i demoläget); egna för ägaren.
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Standardpersonas och egna läses" ON public.personas FOR SELECT TO anon, authenticated
  USING (is_default = TRUE OR (SELECT auth.uid()) = user_id);
CREATE POLICY "Egna personas skapas" ON public.personas FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND is_default = FALSE);
CREATE POLICY "Egna personas ändras" ON public.personas FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND is_default = FALSE)
  WITH CHECK ((SELECT auth.uid()) = user_id AND is_default = FALSE);
CREATE POLICY "Egna personas tas bort" ON public.personas FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND is_default = FALSE);

-- Tabeller med user_id UUID
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ad_analyses', 'generated_copies', 'campaign_plans', 'localizations'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Egna rader" ON public.%I FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)',
      t
    );
  END LOOP;
END $$;

-- Tabeller med ägare som TEXT: (tabell, ägarkolumn)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('production_jobs', 'user_id'),
    ('qa_runs', 'user_id'),
    ('ai_generations', 'user_id'),
    ('user_credits', 'user_id'),
    ('master_creatives', 'created_by'),
    ('creative_briefs', 'created_by'),
    ('campaigns', 'created_by')
  ) AS v(tbl, col) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format(
      'CREATE POLICY "Egna rader" ON public.%I FOR ALL TO authenticated USING ((SELECT auth.uid())::text = %I) WITH CHECK ((SELECT auth.uid())::text = %I)',
      r.tbl, r.col, r.col
    );
  END LOOP;
END $$;

-- Mallbiblioteket delas: alla inloggade läser, bara ägaren ändrar.
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mallar läses av inloggade" ON public.templates FOR SELECT TO authenticated
  USING (TRUE);
CREATE POLICY "Egna mallar skapas" ON public.templates FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY "Egna mallar ändras" ON public.templates FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id) WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY "Egna mallar tas bort" ON public.templates FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

-- QA-trösklar är organisationens inställningar: läses av inloggade.
ALTER TABLE public.qa_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QA-trösklar läses av inloggade" ON public.qa_thresholds FOR SELECT TO authenticated
  USING (TRUE);

-- ── Behörigheter för Data API ───────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.personas TO anon;
