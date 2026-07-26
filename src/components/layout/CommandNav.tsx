/**
 * CommandNav — Desktop side rail + Mobile bottom tabs
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  AlertTriangle,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand';
import { MoreMenu } from '@/components/layout/MoreMenu';
import { useT } from '@/i18n/locale-context';

const mainNav: {
  href: string;
  labelKey: string;
  shortKey: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
}[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.home', icon: LayoutDashboard },
  { href: '/agents', labelKey: 'nav.agents', shortKey: 'nav.agents', icon: Bot },
  {
    href: '/escalations',
    labelKey: 'nav.needsYou',
    shortKey: 'nav.needsYouShort',
    icon: AlertTriangle,
    badge: true,
  },
  { href: '/results', labelKey: 'nav.results', shortKey: 'nav.results', icon: FileText },
];

function NavTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
      {label}
    </span>
  );
}

type Props = {
  pendingEscalations?: number;
  moreSlot?: React.ReactNode;
  hideMobile?: boolean;
  userName?: string;
};

export function CommandNav({
  pendingEscalations = 0,
  moreSlot,
  hideMobile = false,
  userName = 'You',
}: Props) {
  const pathname = usePathname();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const t = useT();

  const navItems = useMemo(
    () =>
      mainNav.map((item) => ({
        ...item,
        label: t(item.labelKey),
        short: t(item.shortKey),
      })),
    [t]
  );

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[68px] flex-col items-center border-r border-border bg-background/95 py-4">
        <Link
          href="/dashboard"
          className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden"
          title="Conductor"
          aria-label={t('a11y.home')}
        >
          <BrandMark onBlack className="h-9 w-9" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1" aria-label={t('a11y.main')}>
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showBadge = Boolean(item.badge && pendingEscalations > 0);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={
                  showBadge
                    ? `${item.label}, ${pendingEscalations} pending`
                    : item.label
                }
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-150',
                  active
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[10px] font-bold text-white">
                    {pendingEscalations > 9 ? '9+' : pendingEscalations}
                  </span>
                )}
                <NavTooltip label={item.label} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">{moreSlot}</div>
      </aside>

      {!hideMobile && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-safe"
          aria-label="Mobile"
        >
          {mobileMoreOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/20"
              aria-label={t('a11y.closeMenu')}
              onClick={() => setMobileMoreOpen(false)}
            />
          )}
          <MoreMenu
            userName={userName}
            open={mobileMoreOpen}
            onClose={() => setMobileMoreOpen(false)}
            placement="up"
          />
          <div className="relative z-50 flex h-14 items-stretch justify-around px-0.5">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const showBadge = Boolean(item.badge && pendingEscalations > 0);
              const mobileShort = item.short;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150',
                    active ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  <span>{mobileShort}</span>
                  {showBadge && (
                    <span className="absolute right-[18%] top-1.5 h-1.5 w-1.5 rounded-full bg-urgent" />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              aria-expanded={mobileMoreOpen}
              aria-label={t('nav.more')}
              onClick={() => setMobileMoreOpen((v) => !v)}
              className={cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150',
                mobileMoreOpen ||
                  pathname.startsWith('/settings') ||
                  pathname.startsWith('/templates') ||
                  pathname.startsWith('/help')
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
              <span>{t('nav.more')}</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
