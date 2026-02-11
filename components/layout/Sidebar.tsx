'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/ad-studio', label: 'Ad Studio' },
  { href: '/copy-studio', label: 'Copy Studio' },
  { href: '/campaign-planner', label: 'Kampanjplanerare' },
  { href: '/localization', label: 'Lokalisering' },
  { href: '/personas', label: 'Personas' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 bg-[#FAFAFA]">
      <div className="px-6 pt-6 pb-8">
        <Link href="/dashboard" className="text-[#0000A0] text-lg font-medium tracking-tight">
          Nordea
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'text-[#0000A0] font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <div className="border-t border-gray-200 pt-4">
          <Link
            href="/settings"
            className={cn(
              'block px-3 py-2 text-xs transition-colors',
              pathname === '/settings'
                ? 'text-[#0000A0] font-medium'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Inställningar
          </Link>
        </div>
      </div>
    </aside>
  );
}
