'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  AlertTriangle,
  Library,
  Settings,
  LogOut,
  Moon,
  Sun,
  FileText,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEscalations } from '@/hooks/useEscalations';
import { CommandBanner } from '@/components/layout/CommandBanner';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/templates', label: 'Templates', icon: Library },
  { href: '/escalations', label: 'Escalations', icon: AlertTriangle },
  { href: '/results', label: 'Results', icon: FileText },
  { href: '/agents/new', label: 'New Agent', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const mobileNav = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/templates', label: 'Launch', icon: Library },
  { href: '/escalations', label: 'Decide', icon: AlertTriangle },
  { href: '/results', label: 'Results', icon: FileText },
];

export function AppShell({
  children,
  userName,
  userId,
  pendingCount: initialPending = 0,
}: {
  children: React.ReactNode;
  userName: string;
  userId: string;
  pendingCount?: number;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { escalations } = useEscalations(userId);
  const pendingCount = escalations.length || initialPending;
  const hideMobileBar = pathname.startsWith('/escalations/');

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-6">
          <Link href="/dashboard" className="block">
            <p className="font-display text-2xl tracking-tight">Conductor</p>
            <p className="text-xs text-muted-foreground mt-1">Command & Control</p>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === '/escalations' && pendingCount > 0 && (
                  <span className="text-[10px] font-semibold bg-urgent text-white rounded px-1.5 py-0.5 animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {userName}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <form action="/auth/signout" method="post" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full justify-start" type="submit">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 pb-20 md:pb-0 flex flex-col">
        <CommandBanner userId={userId} />
        <header className="md:hidden sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl">
            Conductor
          </Link>
          {pendingCount > 0 && (
            <Link
              href="/escalations"
              className="text-xs font-medium text-urgent bg-urgent/10 px-2 py-1 rounded animate-pulse"
            >
              {pendingCount} need you
            </Link>
          )}
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full flex-1">
          {children}
        </main>
      </div>

      {!hideMobileBar && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="grid grid-cols-4">
            {mobileNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center gap-1 py-2.5 text-[10px]',
                    active ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.href === '/escalations' && pendingCount > 0 && (
                    <span className="absolute top-1.5 right-[22%] h-4 min-w-4 px-1 rounded-full bg-urgent text-white text-[9px] font-semibold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
