'use client';

import Link from 'next/link';
import { BrandInline } from '@/components/brand';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/site';
import { useT } from '@/i18n/locale-context';

export function SiteFooter() {
  const year = new Date().getFullYear();
  const t = useT();

  return (
    <footer className="border-t border-[#e4e4e0] bg-[#f4f6f3] text-[#141414]">
      <div className="mx-auto max-w-5xl px-4 sm:px-5 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1 space-y-3">
            <Link href="/" aria-label={t('a11y.home')}>
              <BrandInline
                markClassName="h-7 w-7 !text-[#001444]"
                wordmarkClassName="!text-[#001444] text-[0.85rem]"
              />
            </Link>
            <p className="text-sm text-[#6b6b66] leading-relaxed">{t('brand.tagline')}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">{t('footer.product')}</h3>
            <ul className="space-y-2 text-sm text-[#6b6b66]">
              <li>
                <Link href="/demo" className="hover:text-[#141414] transition-colors">
                  {t('footer.liveDemo')}
                </Link>
              </li>
              <li>
                <Link
                  href="/demo/moment"
                  className="hover:text-[#141414] transition-colors"
                >
                  {t('footer.moment')}
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-[#141414] transition-colors">
                  {t('footer.pricing')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm text-[#6b6b66]">
              <li>
                <Link href="/privacy" className="hover:text-[#141414] transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#141414] transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy#cookies"
                  className="hover:text-[#141414] transition-colors"
                >
                  {t('footer.cookies')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">{t('footer.account')}</h3>
            <ul className="space-y-2 text-sm text-[#6b6b66]">
              <li>
                <Link href="/login" className="hover:text-[#141414] transition-colors">
                  {t('nav.signIn')}
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
          <p>
            © {year} Conductor. {t('footer.rights')}
          </p>
          <p className="text-[#6b6b66]/90">{t('footer.aiDisclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
