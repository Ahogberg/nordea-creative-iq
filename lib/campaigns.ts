// Användarens lokala preferenser. (Den gamla kampanjguiden som sparade i
// localStorage är borttagen — kampanjer lagras i Supabase.)

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
