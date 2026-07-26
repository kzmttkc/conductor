/**
 * Public SiteHeader — Landing / Demo / marketing pages.
 * App shell uses a thinner header or none (side/bottom nav owns navigation).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = {
  signedIn?: boolean;
};

export function SiteHeader({ signedIn = false }: Props) {
  const pathname = usePathname();
  const isMoment = pathname?.startsWith('/demo/moment');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border/60 backdrop-blur',
        isMoment ? 'bg-background/80' : 'bg-background/90'
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-semibold tracking-tight text-foreground hover:opacity-90"
        >
          Conductor
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/demo/moment"
            className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Needs You
          </Link>

          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
              >
                Try live demo
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
