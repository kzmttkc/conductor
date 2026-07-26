import type { Metadata } from 'next';
import { LegalDoc } from '@/components/marketing/LegalDoc';
import { PrivacyBody } from '@/content/legal';
import { getMessages, translate } from '@/i18n/get-messages';
import { getServerLocale } from '@/i18n/locale-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getMessages(locale);
  return {
    title: `${translate(m, 'legal.privacyTitle')} — Conductor`,
    description:
      locale === 'ja'
        ? 'Conductor が情報を収集・利用・保護する方法。'
        : 'How Conductor collects, uses, and protects information.',
  };
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const m = getMessages(locale);
  return (
    <div className="bg-[#f4f6f3] text-[#141414]">
      <LegalDoc
        locale={locale}
        title={translate(m, 'legal.privacyTitle')}
        updated={translate(m, 'legal.updatedDate')}
      >
        <PrivacyBody locale={locale} />
      </LegalDoc>
    </div>
  );
}
