import type { Metadata } from 'next';
import { LegalDoc } from '@/components/marketing/LegalDoc';
import { TermsBody } from '@/content/legal';
import { getMessages, translate } from '@/i18n/get-messages';
import { getServerLocale } from '@/i18n/locale-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getMessages(locale);
  return {
    title: `${translate(m, 'legal.termsTitle')} — Conductor`,
    description:
      locale === 'ja'
        ? 'Conductor サービスの利用条件。'
        : 'Terms governing use of the Conductor service.',
  };
}

export default async function TermsPage() {
  const locale = await getServerLocale();
  const m = getMessages(locale);
  return (
    <div className="bg-[#f4f6f3] text-[#141414]">
      <LegalDoc
        locale={locale}
        title={translate(m, 'legal.termsTitle')}
        updated={translate(m, 'legal.updatedDate')}
      >
        <TermsBody locale={locale} />
      </LegalDoc>
    </div>
  );
}
