'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
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
  Sparkles,
  PenLine,
  Calendar,
  Globe,
  Users,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ad-studio', label: 'Ad Studio', icon: Sparkles },
  { href: '/copy-studio', label: 'Copy Studio', icon: PenLine },
  { href: '/campaign-planner', label: 'Kampanjplanerare', icon: Calendar },
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
    <header className="h-16 bg-transparent backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4 lg:px-8">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden text-white/70 hover:text-white hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-[#0a0a2e] border-white/10">
          <div className="flex items-center h-16 px-5 border-b border-white/6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-nordea-blue to-nordea-vivid rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-white">CreativeIQ</span>
            </Link>
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
                      ? 'bg-gradient-to-r from-nordea-blue to-nordea-vivid text-white shadow-lg shadow-nordea-blue/30'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
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

      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-nordea-blue to-nordea-vivid rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">N</span>
        </div>
        <span className="font-semibold text-white text-sm">CreativeIQ</span>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nordea-blue to-nordea-vivid flex items-center justify-center text-white text-xs font-medium">
              {initials}
            </div>
            <span className="hidden md:inline text-sm text-white/70">
              {userEmail}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-white">{userEmail.split('@')[0]}</p>
            <p className="text-xs text-white/50">{userEmail}</p>
          </div>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 text-white/70 hover:text-white">
              <User className="w-4 h-4" />
              Profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 text-white/70 hover:text-white">
              <Settings className="w-4 h-4" />
              Inställningar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={handleLogout} className="text-nordea-accent-red cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
