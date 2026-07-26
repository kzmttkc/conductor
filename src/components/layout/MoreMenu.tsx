'use client';

import Link from 'next/link';
import { Library, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type Props = {
  userName: string;
  open: boolean;
  onClose: () => void;
  /** Desktop: open to the right. Mobile: open upward. */
  placement?: 'right' | 'up';
  className?: string;
};

export function MoreMenu({
  userName,
  open,
  onClose,
  placement = 'right',
  className,
}: Props) {
  const { theme, setTheme } = useTheme();
  if (!open) return null;

  return (
    <div
      className={cn(
        'z-50 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-lg',
        placement === 'right' && 'absolute bottom-0 left-full ml-2',
        placement === 'up' &&
          'fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.5rem)] right-3 left-3 sm:left-auto w-auto sm:w-56',
        className
      )}
      role="menu"
    >
      <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground truncate">
        {userName}
      </p>
      <Link
        href="/templates"
        onClick={onClose}
        className="flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
        role="menuitem"
      >
        <Library className="h-4 w-4" />
        Templates
      </Link>
      <Link
        href="/settings"
        onClick={onClose}
        className="flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
        role="menuitem"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
      <Link
        href="/help"
        onClick={onClose}
        className="flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
        role="menuitem"
      >
        Help
      </Link>
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
        role="menuitem"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
        Theme
      </button>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          role="menuitem"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}
