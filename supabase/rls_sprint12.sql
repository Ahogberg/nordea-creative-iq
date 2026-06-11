-- Sprint 12: Row Level Security baseline
-- Apply via: supabase db push  OR  psql $DATABASE_URL -f supabase/rls_sprint12.sql
--
-- Tables that previously had no RLS enabled. Each table gets a policy that
-- allows a user to see/modify only their own rows, identified by user_id.
-- The service-role key bypasses RLS automatically so background workers are unaffected.

-- creative_briefs
ALTER TABLE creative_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own briefs" ON creative_briefs
  FOR ALL USING (auth.uid()::text = user_id);

-- campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own campaigns" ON campaigns
  FOR ALL USING (auth.uid()::text = user_id);

-- ai_generations
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own generations" ON ai_generations
  FOR ALL USING (auth.uid()::text = user_id);

-- user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own credits" ON user_credits
  FOR ALL USING (auth.uid()::text = user_id);

-- master_creatives
ALTER TABLE master_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own master creatives" ON master_creatives
  FOR ALL USING (auth.uid()::text = created_by);

-- qa_runs
ALTER TABLE qa_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own qa runs" ON qa_runs
  FOR ALL USING (auth.uid()::text = user_id);

-- qa_thresholds (org-wide config — readable by all authenticated users, writable by admins)
ALTER TABLE qa_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read qa thresholds" ON qa_thresholds
  FOR SELECT USING (auth.role() = 'authenticated');

-- templates (readable by all authenticated users, writable only by owner)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read templates" ON templates
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users modify own templates" ON templates
  FOR ALL USING (auth.uid()::text = created_by);

-- production_jobs
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own production jobs" ON production_jobs
  FOR ALL USING (auth.uid()::text = user_id);
