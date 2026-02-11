'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NordeaLogo } from '@/components/brand/NordeaLogo';
import {
  LayoutDashboard,
  Palette,
  PenTool,
  BarChart3,
  Globe,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ad-studio', label: 'Ad Studio', icon: Palette },
  { href: '/copy-studio', label: 'Copy Studio', icon: PenTool },
  { href: '/campaign-planner', label: 'Kampanjplanerare', icon: BarChart3 },
  { href: '/localization', label: 'Lokalisering', icon: Globe },
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/settings', label: 'Inställningar', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href="/dashboard">
          <NordeaLogo />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#0000A0] text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-medium text-[#0000A0] mb-1">CreativeIQ v1.0</p>
          <p className="text-xs text-gray-500">AI-driven marknadsföring</p>
        </div>
      </div>
    </aside>
  );
}
