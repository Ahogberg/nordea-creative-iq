'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NordeaLogo } from '@/components/brand/NordeaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateNordeaEmail } from '@/lib/auth';
import { Shield, Users, BarChart3, Globe } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Demo mode: accept any @nordea.com email
    setTimeout(() => {
      localStorage.setItem('nordea-user', JSON.stringify({
        email,
        full_name: email.split('@')[0].replace('.', ' '),
        isLoggedIn: true,
      }));
      router.push('/');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0000A0] flex-col justify-between p-12 text-white">
        <div>
          <NordeaLogo variant="white" className="mb-16" />
          <h1 className="text-4xl font-bold mb-4">CreativeIQ</h1>
          <p className="text-xl text-blue-200 mb-12">
            AI-driven kreativ intelligens för Nordeas marknadsföringsteam
          </p>

          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: BarChart3, label: 'Analysera annonser', desc: 'AI-driven kvalitetssäkring' },
              { icon: Users, label: 'Virtuella personas', desc: 'Testa med kundsegment' },
              { icon: Globe, label: 'Nordisk lokalisering', desc: '6 marknader, en plattform' },
              { icon: Shield, label: 'Compliance-check', desc: 'Automatisk regelkontroll' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <item.icon className="w-6 h-6 mb-2 text-blue-200" />
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-blue-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">2,400+</p>
              <p className="text-xs text-blue-200">Annonser analyserade</p>
            </div>
            <div>
              <p className="text-2xl font-bold">142h</p>
              <p className="text-xs text-blue-200">Tid sparad/månad</p>
            </div>
            <div>
              <p className="text-2xl font-bold">94%</p>
              <p className="text-xs text-blue-200">Brand compliance</p>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
}
