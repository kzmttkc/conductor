import { HomeMarketing } from '@/components/marketing/HomeMarketing';
import { buildHomeMetadata } from '@/i18n/site-metadata';

export const generateMetadata = buildHomeMetadata;

export default function HomePage() {
  return <HomeMarketing />;
}
