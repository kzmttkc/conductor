/**
 * Public SiteHeader — Landing / Demo / Login / legal pages.
 * App shell uses a thinner header (side/bottom nav owns navigation).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BrandInline } from '@/components/brand';

type Props = {
  signedIn?: boolean;
};

export function SiteHeader({ signedIn = false }: Props) {
  const pathname = usePathname();
  const isMoment = Boolean(pathname?.startsWith('/demo/moment'));

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur pt-safe',
        isMoment
          ? 'border-white/10 bg-black/55 text-white'
          : 'border-[#e4e4e0]/80 bg-[#f4f6f3]/92 text-[#141414]'
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" aria-label="Conductor home" className="min-w-0">
          <BrandInline
            markClassName={cn(
              'h-7 w-7',
              isMoment ? 'text-[#9aabd0]' : '!text-[#001444]'
            )}
            wordmarkClassName={cn(
              'text-[0.8rem] sm:text-[0.9rem]',
              isMoment ? 'text-[#e8ebf4]' : '!text-[#001444]'
            )}
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/demo/moment"
            className={cn(
              'hidden sm:inline-flex text-sm transition-colors',
              isMoment
                ? 'text-white/70 hover:text-white'
                : 'text-[#6b6b66] hover:text-[#141414]'
            )}
          >
            Needs You
          </Link>

          {signedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                'inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-opacity hover:opacity-90',
                isMoment
                  ? 'bg-white text-black'
                  : 'bg-[#141414] text-[#fafafa]'
              )}
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  'hidden sm:inline-flex text-sm transition-colors',
                  isMoment
                    ? 'text-white/70 hover:text-white'
                    : 'text-[#6b6b66] hover:text-[#141414]'
                )}
              >
                Sign in
              </Link>
              <Link
                href="/demo"
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-3.5 sm:px-4 text-sm font-medium transition-opacity hover:opacity-90',
                  isMoment
                    ? 'bg-white text-black'
                    : 'bg-[#141414] text-[#fafafa]'
                )}
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
