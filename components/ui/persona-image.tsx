'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getPersonaInitials } from '@/lib/persona-library';

interface PersonaImageProps {
  name: string;
  imageUrl?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  sm: { dimension: 40, text: 'text-sm', radius: 'rounded-lg' },
  md: { dimension: 48, text: 'text-base', radius: 'rounded-xl' },
  lg: { dimension: 64, text: 'text-lg', radius: 'rounded-xl' },
  xl: { dimension: 80, text: 'text-xl', radius: 'rounded-2xl' },
};

export function PersonaImage({
  name,
  imageUrl,
  color = 'from-blue-500 to-purple-600',
  size = 'md',
  className = '',
}: PersonaImageProps) {
  const [imageError, setImageError] = useState(false);
  const { dimension, text, radius } = sizeConfig[size];
  const initials = getPersonaInitials(name);

  if (!imageUrl || imageError) {
    return (
      <div
        className={`bg-gradient-to-br ${color} flex items-center justify-center font-semibold text-white shadow-lg ${radius} ${className}`}
        style={{ width: dimension, height: dimension }}
      >
        <span className={text}>{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden shadow-lg ${radius} ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <Image
        src={imageUrl}
        alt={name}
        width={dimension}
        height={dimension}
        className="object-cover w-full h-full"
        onError={() => setImageError(true)}
      />
      <div className={`absolute inset-0 ring-1 ring-inset ring-white/20 ${radius}`} />
    </div>
  );
}
