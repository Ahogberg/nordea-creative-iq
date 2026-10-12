'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PRIMARY_NAV, SETTINGS_NAV, isNavActive } from '@/lib/navigation';
import { NordeaLogo } from '@/components/brand/NordeaLogo';
import type { UserDisplay } from '@/lib/auth/user-display';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  subtitle?: string;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  { label: null, items: PRIMARY_NAV },
  { label: null, items: [SETTINGS_NAV] },
];

export function Sidebar({ user }: { user: UserDisplay }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href: string) =>
    isNavActive(href, pathname);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'demo-session=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sidebar hidden lg:flex">
      <div className="sidebar-logo">
        <NordeaLogo variant="dark" size={32} withProductName />
      </div>

      <nav aria-label="Huvudmeny" className="sidebar-nav custom-scrollbar">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-2' : ''}>
            {section.label && (
              <div className="sidebar-section-title">{section.label}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={item.subtitle ?? item.name}
                  className={`sidebar-item ${active ? 'active' : ''} ${item.subtitle ? 'items-start py-2.5' : ''}`}
                >
                  <Icon className={item.subtitle ? 'mt-0.5' : ''} />
                  <div className="flex-1 min-w-0">
                    <div>{item.name}</div>
                    {item.subtitle && (
                      <div className="text-[10px] text-nordea-text-tertiary mt-0.5 font-normal leading-tight">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0000A0]">
            <div className="w-9 h-9 rounded-lg bg-[#0000A0] flex items-center justify-center text-white text-sm font-medium shrink-0">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || 'Nordea Marketing'}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Inställningar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[#FC6161] cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Logga ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
