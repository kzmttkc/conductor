import type { Metadata } from 'next';
import { LegalDoc } from '@/components/marketing/LegalDoc';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy — Conductor',
  description: 'How Conductor collects, uses, and protects information.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#f4f6f3] text-[#141414]">
      <LegalDoc title="Privacy Policy" updated="July 26, 2026">
        <section>
          <h2>1. Who we are</h2>
          <p>
            Conductor (“we”, “us”) is an AI agent orchestration service.
            Contact:{' '}
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>2. Information we collect</h2>
          <ul>
            <li>Account information (email, name if provided via GitHub or magic link)</li>
            <li>Usage data (agent runs, escalations, approximate token usage, plan)</li>
            <li>Content you submit (mission themes, instructions, escalation responses)</li>
            <li>
              Technical data (browser type, approximate region, logs necessary for
              security and debugging)
            </li>
            <li>
              In Demo Mode without an account, data may be stored locally (cookies /
              local storage) or temporarily on our servers for the session
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How we use information</h2>
          <ul>
            <li>To provide and improve the service</li>
            <li>To operate agent execution, escalations, and reports</li>
            <li>To enforce plan limits and prevent abuse</li>
            <li>To communicate service-related notices</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Processors and third parties</h2>
          <p>We may use:</p>
          <ul>
            <li>Infrastructure and database providers (e.g. Supabase, Vercel)</li>
            <li>Payment processing (Stripe) when you subscribe</li>
            <li>
              AI model providers (e.g. OpenAI, Anthropic) when LLM features are
              enabled — prompts and necessary context may be sent to generate outputs
            </li>
          </ul>
          <p>We do not sell your personal information.</p>
        </section>

        <section id="cookies">
          <h2>5. Cookies and local storage</h2>
          <p>
            We use <strong>essential</strong> cookies and local storage for
            authentication, session continuity, and preferences (for example demo
            session cookies, UI order). These are required for the service to
            function.
          </p>
          <p>
            Analytics or marketing cookies, if introduced later, will be described
            here and subject to consent where required. Today we do not use
            non-essential tracking cookies.
          </p>
        </section>

        <section>
          <h2>6. Data retention</h2>
          <ul>
            <li>Account data: retained while your account is active</li>
            <li>
              Usage and logs: retained for a limited period for security, billing,
              and improvement
            </li>
            <li>
              You may request deletion of your account and associated data subject
              to legal retention requirements
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Your rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or export your data, and to object to certain processing.
            Contact us at <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> to exercise
            these rights.
          </p>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>
            We apply reasonable technical and organizational measures. No method of
            transmission or storage is 100% secure.
          </p>
        </section>

        <section>
          <h2>9. International transfers</h2>
          <p>
            Data may be processed in countries other than your own, including where
            our providers operate.
          </p>
        </section>

        <section>
          <h2>10. Changes</h2>
          <p>
            We may update this policy. Material changes will be indicated by
            updating the “Last updated” date.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            For privacy requests: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
          </p>
        </section>
      </LegalDoc>
    </div>
  );
}
