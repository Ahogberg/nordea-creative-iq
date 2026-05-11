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
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Users,
  Rocket,
  Settings,
  LogOut,
  User,
  LayoutGrid,
  Settings2,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NordeaLogo } from '@/components/brand/NordeaLogo';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

// Sprint 7 nav: consolidated creation surface (/create), Asset Library + QA
// surfaced, Verktyg-group for secondary tools. Old /ad-studio /copy-studio
// /motion-studio routes are removed in favour of /create/{copy,video,analyze}.
const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Kampanjer', href: '/campaigns', icon: Rocket },
      { name: 'Create', href: '/create', icon: Sparkles },
      { name: 'Templates', href: '/templates', icon: LayoutGrid },
      { name: 'Produce', href: '/produce', icon: Settings2 },
      { name: 'Asset Library', href: '/dam', icon: FolderOpen },
      { name: 'QA Reports', href: '/qa', icon: ShieldCheck },
      { name: 'Personas', href: '/personas', icon: Users },
    ],
  },
  {
    label: 'Verktyg',
    items: [
      { name: 'Mediaplanering', href: '/campaign-planner', icon: Calendar },
    ],
  },
  {
    label: 'System',
    items: [{ name: 'Inställningar', href: '/settings', icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

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

      <nav className="sidebar-nav custom-scrollbar">
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
                  className={`sidebar-item ${active ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{item.name}</span>
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
              AH
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">Andreas H.</p>
              <p className="text-xs text-gray-500 truncate">Nordea Marketing</p>
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
