'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateNordeaEmail } from '@/lib/auth';

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

    setTimeout(() => {
      localStorage.setItem('nordea-user', JSON.stringify({
        email,
        full_name: email.split('@')[0].replace('.', ' '),
        isLoggedIn: true,
      }));
      router.push('/');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <h1 className="text-[#0000A0] text-xl font-medium tracking-tight">Nordea</h1>
          <p className="text-gray-400 text-sm mt-1">CreativeIQ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-gray-500 mb-1.5">
              E-post
            </label>
            <input
              id="email"
              type="email"
              placeholder="fornamn.efternamn@nordea.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-[#0000A0] focus:ring-1 focus:ring-[#0000A0] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs text-gray-500 mb-1.5">
              Losenord
            </label>
            <input
              id="password"
              type="password"
              placeholder="Ange ditt losenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-[#0000A0] focus:ring-1 focus:ring-[#0000A0] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[#0000A0] hover:bg-[#000080] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  );
}
