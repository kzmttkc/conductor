import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDoc } from '@/components/marketing/LegalDoc';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service — Conductor',
  description: 'Terms governing use of the Conductor command tower.',
};

export default function TermsPage() {
  return (
    <div className="bg-[#f4f6f3] text-[#141414]">
      <LegalDoc title="Terms of Service" updated="July 26, 2026">
        <section>
          <h2>1. Service</h2>
          <p>
            Conductor provides tools to orchestrate and supervise AI agents,
            including escalation (human-in-the-loop) workflows and related reports.
          </p>
        </section>

        <section>
          <h2>2. Eligibility and accounts</h2>
          <p>
            You must provide accurate information and keep your credentials secure.
            You are responsible for activity under your account.
          </p>
        </section>

        <section>
          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Violate law or third-party rights</li>
            <li>
              Attempt to disrupt or reverse engineer the service beyond permitted use
            </li>
            <li>
              Use the service to generate or distribute harmful, illegal, or abusive
              content
            </li>
            <li>Circumvent plan limits or security controls</li>
          </ul>
        </section>

        <section>
          <h2>4. AI outputs</h2>
          <p>
            <strong>
              AI agents may produce incorrect, incomplete, or misleading outputs.
            </strong>{' '}
            You remain solely responsible for decisions and actions taken based on
            outputs from the service. Conductor does not guarantee accuracy,
            completeness, or fitness for a particular purpose.
          </p>
        </section>

        <section>
          <h2>5. Plans, fees, and cancellation</h2>
          <ul>
            <li>
              Free and paid plans are described on the{' '}
              <Link href="/#pricing">pricing</Link> section
            </li>
            <li>Paid subscriptions renew until cancelled</li>
            <li>Fees are handled via our payment provider (Stripe)</li>
            <li>
              Refunds are handled according to the policy stated at purchase or
              required by law
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual property</h2>
          <ul>
            <li>
              The service, branding, and software are owned by us or our licensors
            </li>
            <li>
              You retain rights to content you submit; you grant us a license to
              process it solely to provide the service
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Availability and changes</h2>
          <p>
            We may modify, suspend, or discontinue features. We aim for high
            availability but do not guarantee uninterrupted service.
          </p>
        </section>

        <section>
          <h2>8. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND, EXPRESS
            OR IMPLIED, TO THE MAXIMUM EXTENT PERMITTED BY LAW.
          </p>
        </section>

        <section>
          <h2>9. Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
            ANY LOSS OF PROFITS, DATA, OR GOODWILL. OUR TOTAL LIABILITY FOR ANY
            CLAIM SHALL NOT EXCEED THE AMOUNTS YOU PAID TO US IN THE TWELVE (12)
            MONTHS PRECEDING THE CLAIM (OR ONE HUNDRED USD IF YOU PAID NOTHING).
          </p>
        </section>

        <section>
          <h2>10. Termination</h2>
          <p>
            We may suspend or terminate access for breach of these terms or to
            protect the service. You may stop using the service at any time.
          </p>
        </section>

        <section>
          <h2>11. Governing law</h2>
          <p>
            These terms are governed by the laws of Japan, without regard to
            conflict-of-law principles. Courts in Japan shall have exclusive
            jurisdiction, unless mandatory consumer protections require otherwise.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
          </p>
        </section>
      </LegalDoc>
    </div>
  );
}
