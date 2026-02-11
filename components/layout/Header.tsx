'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { NordeaLogo } from '@/components/brand/NordeaLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Palette,
  PenTool,
  BarChart3,
  Globe,
  Users,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ad-studio', label: 'Ad Studio', icon: Palette },
  { href: '/copy-studio', label: 'Copy Studio', icon: PenTool },
  { href: '/campaign-planner', label: 'Kampanjplanerare', icon: BarChart3 },
  { href: '/localization', label: 'Lokalisering', icon: Globe },
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/settings', label: 'Inställningar', icon: Settings },
];

interface HeaderProps {
  user: SupabaseUser;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const userEmail = user.email || '';
  const initials = userEmail
    ? userEmail.split('@')[0].split('.').map(n => n[0]?.toUpperCase()).join('').slice(0, 2)
    : 'U';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <NordeaLogo />
          </div>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#0000A0] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="lg:hidden">
        <NordeaLogo />
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0000A0] flex items-center justify-center text-white text-xs font-medium">
              {initials}
            </div>
            <span className="hidden md:inline text-sm text-gray-700">
              {userEmail}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{userEmail.split('@')[0]}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
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
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
