interface PersonaAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PersonaAvatar({ name, size = 'md' }: PersonaAvatarProps) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };

  return (
    <div className={`${sizes[size]} rounded-lg bg-gray-100 flex items-center justify-center font-semibold text-[#0000A0]`}>
      {initials}
    </div>
  );
}
