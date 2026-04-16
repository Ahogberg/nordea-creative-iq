'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NordeaLogo } from '@/components/brand/NordeaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [message, setMessage] = useState('');

  const handleDemoLogin = () => {
    document.cookie = 'demo-session=true; path=/; max-age=86400; SameSite=Lax';
    router.push('/dashboard');
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage('Kolla din inbox! Vi har skickat en inloggningslänk.');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage('Kolla din inbox för att verifiera din email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Något gick fel';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm">
        <div className="text-center mb-8">
          <NordeaLogo className="mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">CreativeIQ</h1>
          <p className="text-sm text-gray-500 mt-1">Logga in för att fortsätta</p>
        </div>

        {/* Demo login */}
        <Button
          type="button"
          onClick={handleDemoLogin}
          className="w-full mb-6 bg-[#0000A0] hover:bg-[#000080]"
        >
          Logga in som demo-användare
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">eller med Supabase</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-postadress</Label>
            <Input
              id="email"
              type="email"
              placeholder="din.email@nordea.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'magic' && (
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600">
              {message}
            </div>
          )}

          <Button
            type="submit"
            variant="outline"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Vänta...' : mode === 'signup' ? 'Skapa konto' : mode === 'magic' ? 'Skicka Magic Link' : 'Logga in med lösenord'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm space-x-4">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => setMode('magic')} className="text-[#0000A0] hover:underline">
                Magic link
              </button>
              <button type="button" onClick={() => setMode('signup')} className="text-[#0000A0] hover:underline">
                Skapa konto
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" onClick={() => setMode('login')} className="text-[#0000A0] hover:underline">
              Tillbaka till login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
