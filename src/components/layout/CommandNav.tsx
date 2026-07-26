/**
 * CommandNav — Desktop side rail + Mobile bottom tabs
 * Integrates into AppShell; pendingEscalations from existing hooks.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  AlertTriangle,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand';

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

type Props = {
  pendingEscalations?: number;
  moreSlot?: React.ReactNode;
  hideMobile?: boolean;
};

export function CommandNav({
  pendingEscalations = 0,
  moreSlot,
  hideMobile = false,
}: Props) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[68px] flex-col items-center border-r border-border bg-background/95 py-4">
        <Link
          href="/dashboard"
          className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden"
          title="Conductor"
          aria-label="Conductor home"
        >
          <BrandMark onBlack className="h-9 w-9" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Main">
          {mainNav.map((item) => {
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
          <div className="flex h-14 items-stretch justify-around px-0.5">
            {mainNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const showBadge = Boolean(item.badge && pendingEscalations > 0);
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
                  <span>{item.short}</span>
                  {showBadge && (
                    <span className="absolute right-[18%] top-1.5 h-1.5 w-1.5 rounded-full bg-urgent" />
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
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150',
                pathname.startsWith('/settings') || pathname.startsWith('/templates')
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
              <span>More</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
