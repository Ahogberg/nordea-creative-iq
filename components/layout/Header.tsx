'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/ad-studio', label: 'Ad Studio' },
  { href: '/copy-studio', label: 'Copy Studio' },
  { href: '/campaign-planner', label: 'Kampanjplanerare' },
  { href: '/localization', label: 'Lokalisering' },
  { href: '/personas', label: 'Personas' },
  { href: '/settings', label: 'Inställningar' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('nordea-user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserEmail(parsed.email || '');
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nordea-user');
    router.push('/login');
  };

  const initials = userEmail
    ? userEmail.split('@')[0].split('.').map(n => n[0]?.toUpperCase()).join('')
    : 'N';

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 bg-[#FAFAFA]">
          <div className="px-6 pt-6 pb-8">
            <span className="text-[#0000A0] text-lg font-medium tracking-tight">Nordea</span>
          </div>
          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
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
        </SheetContent>
      </Sheet>

      <div className="lg:hidden text-[#0000A0] font-medium">Nordea</div>

      <div className="hidden lg:block" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 shadow-sm">
          <div className="px-3 py-2">
            <p className="text-sm text-gray-900">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="text-sm">Profil</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-sm text-gray-500">
            Logga ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
