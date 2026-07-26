'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEscalations } from '@/hooks/useEscalations';
import { CommandBanner } from '@/components/layout/CommandBanner';
import { CommandNav } from '@/components/layout/CommandNav';
import { MoreMenu } from '@/components/layout/MoreMenu';
import { BrandInline } from '@/components/brand';
import { useT } from '@/i18n/locale-context';

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
  const { escalations } = useEscalations(userId);
  const t = useT();
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
    ? t('nav.agents')
    : pathname.startsWith('/escalations')
      ? t('needsYou.title')
      : pathname.startsWith('/results')
        ? t('nav.results')
        : pathname.startsWith('/templates')
          ? t('nav.templates')
          : pathname.startsWith('/settings')
            ? t('nav.settings')
            : pathname.startsWith('/help')
              ? t('nav.help')
              : t('nav.dashboard');

  const moreControl = (
    <div className="relative" ref={moreRef}>
      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        title={t('nav.more')}
        aria-label={t('nav.more')}
        aria-expanded={moreOpen}
        className={cn(
          'group relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-150',
          moreOpen ||
            pathname.startsWith('/templates') ||
            pathname.startsWith('/settings') ||
            pathname.startsWith('/help')
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {t('nav.more')}
        </span>
      </button>
      <MoreMenu
        userName={userName}
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        placement="right"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <CommandNav
        pendingEscalations={pendingCount}
        moreSlot={moreControl}
        hideMobile={hideMobileBar}
        userName={userName}
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
                markClassName="h-5 w-5 text-foreground"
                wordmarkClassName="text-[0.72rem] tracking-[0.2em] text-foreground"
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
              {t('app.needsPending', { n: pendingCount })}
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
