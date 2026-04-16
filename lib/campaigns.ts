import type { Campaign } from '@/types/campaign';

const STORAGE_KEY = 'nordea-campaigns';
const PREFS_KEY = 'nordea-user-prefs';

export interface UserPrefs {
  autoLocalizeMarkets: string[];
}

export function getUserPrefs(): UserPrefs {
  if (typeof window === 'undefined') return { autoLocalizeMarkets: [] };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { autoLocalizeMarkets: [] };
}

export function saveUserPrefs(prefs: UserPrefs): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function listCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Campaign[];
      return all.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  } catch {
    // ignore
  }
  return [];
}

export function getCampaign(id: string): Campaign | null {
  const all = listCampaigns();
  return all.find((c) => c.id === id) || null;
}

export function saveCampaign(campaign: Campaign): void {
  if (typeof window === 'undefined') return;
  const all = listCampaigns();
  const idx = all.findIndex((c) => c.id === campaign.id);
  const updated: Campaign = { ...campaign, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = updated;
  else all.push(updated);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteCampaign(id: string): void {
  if (typeof window === 'undefined') return;
  const all = listCampaigns().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
