-- Campaign choices are distinct from the AI recommendations stored on briefs.
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS channels TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS formats TEXT[] NOT NULL DEFAULT '{}';
