export function validateNordeaEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@nordea.com');
}

// Mock user for demo when Supabase is not configured
export const mockUser = {
  id: 'mock-user-id',
  email: 'test@nordea.com',
  full_name: 'Test Användare',
  department: 'Marketing',
  role: 'admin' as const,
  language: 'sv' as const,
};

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
  );
}

export function isAIConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
