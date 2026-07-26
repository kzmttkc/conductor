import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getCurrentUser } from '@/lib/auth';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
