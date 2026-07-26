'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  AlertTriangle,
  FileText,
  MoreHorizontal,
  Library,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useEscalations } from '@/hooks/useEscalations';
import { CommandBanner } from '@/components/layout/CommandBanner';

const mainNav: {
  href: string;
  label: string;
  short: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
}[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, short: 'Home' },
  { href: '/agents', label: 'Agents', icon: Bot, short: 'Agents' },
  {
    href: '/escalations',
    label: 'Needs You',
    icon: AlertTriangle,
    short: 'Needs',
    badge: true,
  },
  { href: '/results', label: 'Results', icon: FileText, short: 'Results' },
];

function NavTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [moreOpen]);

  const pageTitle =
    mainNav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
      ?.label ??
    (pathname.startsWith('/templates')
      ? 'Templates'
      : pathname.startsWith('/settings')
        ? 'Settings'
        : 'Conductor');

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop side rail */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[68px] flex-col items-center border-r border-border bg-background/95 py-4">
        <Link
          href="/dashboard"
          className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background font-display text-sm tracking-tight"
          title="Conductor"
          aria-label="Conductor home"
        >
          C
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Main">
          {mainNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showBadge = item.badge && pendingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={
                  showBadge ? `${item.label}, ${pendingCount} pending` : item.label
                }
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150',
                  active
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[10px] font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
                <NavTooltip label={item.label} />
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            title="More"
            aria-label="More"
            aria-expanded={moreOpen}
            className={cn(
              'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150',
              moreOpen ||
                pathname.startsWith('/templates') ||
                pathname.startsWith('/settings')
                ? 'bg-foreground/10 text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <NavTooltip label="More" />
          </button>
          {moreOpen && (
            <div className="absolute bottom-0 left-full z-50 ml-2 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
              <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground truncate">
                {userName}
              </p>
              <Link
                href="/templates"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
              >
                <Library className="h-4 w-4" />
                Templates
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
              >
                <Sun className="h-4 w-4 dark:hidden" />
                <Moon className="hidden h-4 w-4 dark:block" />
                Theme
              </button>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 md:pl-[68px] flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <CommandBanner userId={userId} />

        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 md:px-6">
          <div className="min-w-0">
            <p className="md:hidden font-display text-lg tracking-tight">Conductor</p>
            <p className="hidden md:block text-sm font-medium truncate">{pageTitle}</p>
          </div>
          {pendingCount > 0 ? (
            <Link
              href={
                escalations[0] ? `/escalations/${escalations[0].id}` : '/escalations'
              }
              className="shrink-0 text-xs font-semibold text-white bg-urgent px-2.5 py-1.5 rounded-md animate-pulse transition-opacity duration-150 hover:opacity-90"
            >
              Needs You · {pendingCount}
            </Link>
          ) : (
            <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[40%]">
              {userName}
            </span>
          )}
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full flex-1">
          {children}
        </main>
      </div>

      {/* Mobile bottom tabs */}
      {!hideMobileBar && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Mobile"
        >
          <div className="flex h-14 items-stretch justify-around px-0.5">
            {mainNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const showBadge = item.badge && pendingCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors duration-150',
                    active ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.short}</span>
                  {showBadge && (
                    <span className="absolute right-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[9px] font-bold text-white">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link
              href="/settings"
              aria-current={
                pathname.startsWith('/settings') || pathname.startsWith('/templates')
                  ? 'page'
                  : undefined
              }
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors duration-150',
                pathname.startsWith('/settings') || pathname.startsWith('/templates')
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
