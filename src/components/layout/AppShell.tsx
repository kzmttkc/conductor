'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
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
import { CommandNav } from '@/components/layout/CommandNav';
import { BrandInline } from '@/components/brand';

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

  const pageTitle = pathname.startsWith('/agents')
    ? 'Agents'
    : pathname.startsWith('/escalations')
      ? 'Needs You'
      : pathname.startsWith('/results')
        ? 'Results'
        : pathname.startsWith('/templates')
          ? 'Templates'
          : pathname.startsWith('/settings')
            ? 'Settings'
            : 'Dashboard';

  const moreControl = (
    <div className="relative" ref={moreRef}>
      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        title="More"
        aria-label="More"
        aria-expanded={moreOpen}
        className={cn(
          'group relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-150',
          moreOpen ||
            pathname.startsWith('/templates') ||
            pathname.startsWith('/settings')
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          More
        </span>
      </button>
      {moreOpen && (
        <div className="absolute bottom-0 left-full z-50 ml-2 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
          <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground truncate">
            {userName}
          </p>
          <Link
            href="/templates"
            className="flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
          >
            <Library className="h-4 w-4" />
            Templates
          </Link>
          <Link
            href="/settings"
            className="flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
            Theme
          </button>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <CommandNav
        pendingEscalations={pendingCount}
        moreSlot={moreControl}
        hideMobile={hideMobileBar}
      />

      <div
        className={cn(
          'flex-1 min-w-0 md:pl-[68px] flex flex-col',
          hideMobileBar ? 'pb-0' : 'pb-tab'
        )}
      >
        <CommandBanner userId={userId} />

        <header className="sticky top-0 z-20 h-12 border-b border-border bg-background/85 backdrop-blur px-4 flex items-center justify-between gap-3 md:px-6">
          <div className="min-w-0">
            <div className="md:hidden">
              <BrandInline
                markClassName="h-5 w-5 text-[#9aabd0]"
                wordmarkClassName="text-[0.72rem] tracking-[0.2em] text-[#e8ebf4]"
              />
            </div>
            <p className="hidden md:block text-sm font-medium truncate">{pageTitle}</p>
          </div>
          {pendingCount > 0 ? (
            <Link
              href={
                escalations[0] ? `/escalations/${escalations[0].id}` : '/escalations'
              }
              className="shrink-0 min-h-9 inline-flex items-center text-xs font-semibold text-white bg-urgent px-3 rounded-md animate-pulse transition-opacity duration-150 hover:opacity-90"
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
    </div>
  );
}
