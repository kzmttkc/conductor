/**
 * Public SiteFooter — Landing / Demo / Login / legal.
 * Keep App (dashboard) layouts free of this footer.
 */

import Link from 'next/link';
import { BrandInline } from '@/components/brand';
import { SITE_TAGLINE, SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/site';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e4e4e0] bg-[#f4f6f3] text-[#141414]">
      <div className="mx-auto max-w-5xl px-4 sm:px-5 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1 space-y-3">
            <Link href="/" aria-label="Conductor home">
              <BrandInline
                markClassName="h-7 w-7 !text-[#001444]"
                wordmarkClassName="!text-[#001444] text-[0.85rem]"
              />
            </Link>
            <p className="text-sm text-[#6b6b66] leading-relaxed">{SITE_TAGLINE}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-[#6b6b66]">
              <li>
                <Link href="/demo" className="hover:text-[#141414] transition-colors">
                  Live demo
                </Link>
              </li>
              <li>
                <Link
                  href="/demo/moment"
                  className="hover:text-[#141414] transition-colors"
                >
                  Needs You moment
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-[#141414] transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-[#6b6b66]">
              <li>
                <Link href="/privacy" className="hover:text-[#141414] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#141414] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy#cookies"
                  className="hover:text-[#141414] transition-colors"
                >
                  Cookie notice
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-[#6b6b66]">
              <li>
                <Link href="/login" className="hover:text-[#141414] transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <a
                  href={SUPPORT_MAILTO}
                  className="hover:text-[#141414] transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#e4e4e0] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-[#6b6b66]">
          <p>© {year} Conductor. All rights reserved.</p>
          <p className="text-[#6b6b66]/90">
            AI outputs may be incorrect. You remain responsible for decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
