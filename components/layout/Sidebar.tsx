'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Image, PenLine, Calendar, Globe, Users, Settings } from 'lucide-react';

const nav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ad Studio', href: '/ad-studio', icon: Image },
  { name: 'Copy Studio', href: '/copy-studio', icon: PenLine },
  { name: 'Kampanjplanerare', href: '/campaign-planner', icon: Calendar },
  { name: 'Lokalisering', href: '/localization', icon: Globe },
  { name: 'Personas', href: '/personas', icon: Users },
  { name: 'Inställningar', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200 z-30 hidden lg:block">
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0000A0] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-gray-900">Nordea</span>
        </Link>
      </div>
      <nav className="p-3 space-y-0.5">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-[#0000A0] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
