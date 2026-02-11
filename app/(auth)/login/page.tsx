'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NordeaLogo } from '@/components/brand/NordeaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateNordeaEmail } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && url !== 'https://placeholder.supabase.co' && key && key !== 'placeholder-key') {
      setUseSupabase(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateNordeaEmail(email)) {
      setError('Endast @nordea.com-adresser är tillåtna.');
      return;
    }

    if (!password) {
      setError('Ange ditt lösenord.');
      return;
    }

    setLoading(true);

    if (useSupabase) {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          const { error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: email.split('@')[0].replace('.', ' '),
              },
            },
          });

          if (signupError) {
            setError(signupError.message);
            setLoading(false);
            return;
          }
        } else {
          setError(authError.message);
          setLoading(false);
          return;
        }
      }

      router.push('/dashboard');
      router.refresh();
    } else {
      setTimeout(() => {
        localStorage.setItem('nordea-user', JSON.stringify({
          email,
          full_name: email.split('@')[0].replace('.', ' '),
          isLoggedIn: true,
        }));
        router.push('/dashboard');
        setLoading(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0000A0] flex-col justify-between p-12 text-white">
        <div>
          <NordeaLogo variant="white" className="mb-16" />
          <h1 className="text-4xl font-bold mb-4">CreativeIQ</h1>
          <p className="text-xl text-blue-200">
            AI-driven kreativ intelligens för Nordeas marknadsföringsteam
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8">
            <NordeaLogo />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Logga in</h2>
            <p className="text-gray-500 mt-1">
              Använd din Nordea-e-postadress för att logga in
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                type="email"
                placeholder="fornamn.efternamn@nordea.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ange ditt lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0000A0] hover:bg-[#000080] text-white font-medium text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loggar in...
                </span>
              ) : (
                'Logga in'
              )}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-4">
            <Shield className="w-3 h-3" />
            <span>Skyddad av Nordea Enterprise Security</span>
          </div>

          {!useSupabase && (
            <p className="text-center text-xs text-amber-600">
              Demo-läge: Supabase ej konfigurerad
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
