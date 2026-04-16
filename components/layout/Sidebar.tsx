'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  PenLine,
  Calendar,
  Users,
  Film,
  Rocket,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kampanjer', href: '/campaigns', icon: Rocket },
  { name: 'Ad Studio', href: '/ad-studio', icon: Sparkles },
  { name: 'Copy Studio', href: '/copy-studio', icon: PenLine },
  { name: 'Motion Studio', href: '/motion-studio', icon: Film },
  { name: 'Mediaplanering', href: '/campaign-planner', icon: Calendar },
  { name: 'Personas', href: '/personas', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="sidebar hidden lg:flex">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">N</div>
        <span className="sidebar-logo-text">CreativeIQ</span>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav custom-scrollbar">
        <div className="sidebar-section-title">Verktyg</div>

        {navigation.map((item) => {
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

      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nordea-blue to-nordea-vivid flex items-center justify-center text-white text-sm font-medium">
            AH
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Andreas H.</p>
            <p className="text-xs text-white/50 truncate">Nordea Marketing</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
