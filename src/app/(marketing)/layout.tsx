import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SkipLink } from '@/components/i18n/SkipLink';
import { EssentialCookieNotice } from '@/components/marketing/EssentialCookieNotice';
import { getCurrentUser } from '@/lib/auth';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <SiteHeader signedIn={Boolean(user)} />
      <div id="main" className="flex-1">
        {children}
      </div>
      <SiteFooter />
      <EssentialCookieNotice />
    </div>
  );
}
