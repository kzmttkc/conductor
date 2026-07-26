/**
 * 参考実装スケルトン — AppShell のナビ部分
 * 既存の AppShell.tsx に統合する際の指針として使用してください。
 * そのままコピーするのではなく、現在の構造に合わせて適応させること。
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

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/escalations', label: 'Needs You', icon: AlertTriangle, badgeKey: 'escalations' },
  { href: '/results', label: 'Results', icon: FileText },
] as const;

type Props = {
  pendingEscalations?: number;
};

export function CommandNav({ pendingEscalations = 0 }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop side rail */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[68px] flex-col items-center border-r border-border bg-background/95 py-4 gap-1">
        <div className="mb-6 text-xs font-semibold tracking-tight text-muted-foreground">
          C
        </div>
        {mainNav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.badgeKey === 'escalations' && pendingEscalations > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                active
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              {showBadge && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {pendingEscalations > 9 ? '9+' : pendingEscalations}
                </span>
              )}
            </Link>
          );
        })}
        <div className="mt-auto">
          <Link
            href="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            title="More"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur safe-area-pb">
        <div className="flex h-14 items-center justify-around px-1">
          {mainNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            const showBadge = item.badgeKey === 'escalations' && pendingEscalations > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px]',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label === 'Needs You' ? 'Needs' : item.label}</span>
                {showBadge && (
                  <span className="absolute right-1/4 top-0.5 h-1.5 w-1.5 rounded-full bg-red-600" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
