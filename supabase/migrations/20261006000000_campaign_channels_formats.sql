-- Kanaler och format som kampanjen ska användas i (lib/campaign-options.ts).
-- Skiljer sig från briefens rekommendationer: det här är det man valt.
-- Redan körd i det nuvarande projektet (från #14) — IF NOT EXISTS gör den ofarlig.
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS channels TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS formats TEXT[] NOT NULL DEFAULT '{}';
