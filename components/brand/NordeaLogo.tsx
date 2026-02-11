'use client';

import { useEffect, useState } from 'react';

interface NordeaLogoProps {
  variant?: 'dark' | 'white';
  className?: string;
}

export function NordeaLogo({ variant = 'dark', className = '' }: NordeaLogoProps) {
  const [logoExists, setLogoExists] = useState<boolean | null>(null);
  const logoSrc = variant === 'white' ? '/images/nordea-logo-white.svg' : '/images/nordea-logo.svg';

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoExists(true);
    img.onerror = () => setLogoExists(false);
    img.src = logoSrc;
  }, [logoSrc]);

  if (logoExists === null) {
    return <div className={`h-8 ${className}`} />;
  }

  if (logoExists) {
    return (
      <img src={logoSrc} alt="Nordea" className={`h-8 ${className}`} />
    );
  }

  // Placeholder fallback
  const textColor = variant === 'white' ? 'text-white' : 'text-[#0000A0]';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-8 h-8 rounded-lg ${variant === 'white' ? 'bg-white/20' : 'bg-[#0000A0]'} flex items-center justify-center`}>
        <span className={`font-bold text-lg ${variant === 'white' ? 'text-white' : 'text-white'}`}>N</span>
      </div>
      <span className={`font-bold text-xl tracking-tight ${textColor}`}>Nordea</span>
    </div>
  );
}
