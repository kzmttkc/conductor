import { MomentMarketing } from '@/components/marketing/MomentMarketing';
import { buildMomentMetadata } from '@/i18n/site-metadata';

export const generateMetadata = buildMomentMetadata;

export default function DemoMomentPage() {
  return <MomentMarketing />;
}
