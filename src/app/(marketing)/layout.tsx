import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <SiteHeader signedIn={Boolean(user)} />
      <div id="main" className="flex-1">
        {children}
      </div>
      <SiteFooter />
      <EssentialCookieNotice />
    </div>
  );
}
