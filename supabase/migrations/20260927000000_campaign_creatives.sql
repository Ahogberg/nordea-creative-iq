-- Kampanjen äger sitt material: videon (Motion Studio) och displaypaketet.
-- template_ids/master_creative_ids finns kvar för /produce och /create/master.
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS video_config JSONB;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS display_set JSONB;

DROP TRIGGER IF EXISTS campaigns_touch_updated_at ON public.campaigns;
CREATE TRIGGER campaigns_touch_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
