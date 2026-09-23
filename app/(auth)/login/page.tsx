'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validateNordeaEmail } from '@/lib/auth';
import { NordeaLogo } from '@/components/brand/NordeaLogo';
import { LoginShowcase } from '@/components/brand/login-showcase';
import { ArrowRight, Loader2 } from 'lucide-react';

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

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

    if (!validateNordeaEmail(email)) {
      setError('Endast @nordea.com-adresser tillåts.');
      return;
    }

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
    <div className="min-h-screen grid lg:grid-cols-[1.15fr_1fr] bg-white">
      {/* Vänster: varumärke + vitrin */}
      <div className="relative hidden lg:flex flex-col bg-nordea-blue text-white overflow-hidden">
        <div className="absolute inset-0">
          <LoginShowcase />
        </div>
        <div className="relative z-10 px-12 pt-10">
          <NordeaLogo variant="white" size={28} withProductName />
        </div>
        <div className="flex-1" />
        <div className="relative z-10 px-12 pb-12 pt-24 bg-gradient-to-t from-nordea-blue via-nordea-blue/90 to-transparent">
          <h2 className="nordea-display text-[40px] leading-[1.05] max-w-md text-white">
            Från brief till godkänd annons.
          </h2>
          <p className="text-white/70 text-[15px] mt-3 max-w-md leading-relaxed">
            Skapa on-brand annonser i volym, testa dem mot simulerade kunder och säkra compliance — innan de går ut.
          </p>
        </div>
      </div>

      {/* Höger: formulär */}
      <div className="flex items-center justify-center px-6 py-12 bg-nordea-bg lg:bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <NordeaLogo size={28} withProductName />
          </div>

          <div className="nordea-eyebrow mb-2">Intern plattform · Nordea Marketing</div>
          <h1 className="nordea-display text-3xl text-nordea-deep">
            {mode === 'signup' ? 'Skapa konto' : mode === 'magic' ? 'Logga in med länk' : 'Välkommen tillbaka'}
          </h1>
          <p className="text-sm text-nordea-text-secondary mt-2 mb-8">
            Endast för medarbetare med en @nordea.com-adress.
          </p>

          {DEMO_ENABLED && mode === 'login' && (
            <>
              <button type="button" onClick={handleDemoLogin} className="nordea-btn nordea-btn-cobalt nordea-btn-lg nordea-btn-full">
                Fortsätt som demo-användare
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-nordea-hairline" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-nordea-bg lg:bg-white px-3 text-[11px] text-nordea-text-tertiary">eller med ditt konto</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="nordea-eyebrow block mb-1.5">E-post</span>
              <input
                id="email"
                type="email"
                placeholder="fornamn.efternamn@nordea.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="nordea-input w-full h-11"
              />
            </label>

            {mode !== 'magic' && (
              <label className="block">
                <span className="nordea-eyebrow block mb-1.5">Lösenord</span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="nordea-input w-full h-11"
                />
              </label>
            )}

            {error && (
              <div className="rounded-lg bg-nordea-rose-soft px-3 py-2.5 text-sm text-nordea-rose">{error}</div>
            )}
            {message && (
              <div className="rounded-lg bg-nordea-green-soft px-3 py-2.5 text-sm text-nordea-green">{message}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`nordea-btn nordea-btn-lg nordea-btn-full disabled:opacity-60 ${DEMO_ENABLED ? 'nordea-btn-secondary' : 'nordea-btn-cobalt'}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Vänta…' : mode === 'signup' ? 'Skapa konto' : mode === 'magic' ? 'Skicka inloggningslänk' : 'Logga in'}
            </button>
          </form>

          <div className="mt-5 flex justify-center gap-5 text-[13px]">
            {mode === 'login' ? (
              <>
                <button type="button" onClick={() => setMode('magic')} className="text-nordea-blue hover:underline">
                  Logga in med länk
                </button>
                <button type="button" onClick={() => setMode('signup')} className="text-nordea-blue hover:underline">
                  Skapa konto
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="text-nordea-blue hover:underline">
                Tillbaka till inloggning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
