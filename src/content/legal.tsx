import Link from 'next/link';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/site';
import type { Locale } from '@/i18n/types';

export function PrivacyBody({ locale }: { locale: Locale }) {
  if (locale === 'ja') {
    return (
      <>
        <section>
          <h2>1. 事業者</h2>
          <p>
            Conductor（「当社」）は AI エージェント指揮・監督サービスです。連絡先:{' '}
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>。
          </p>
        </section>
        <section>
          <h2>2. 収集する情報</h2>
          <ul>
            <li>アカウント情報（メール、GitHub / マジックリンクで提供された名前）</li>
            <li>利用データ（エージェント実行、判断依頼、おおよそのトークン使用量、プラン）</li>
            <li>提出コンテンツ（調査テーマ、指示、Needs You への回答）</li>
            <li>技術データ（ブラウザ種別、おおよその地域、セキュリティ・デバッグに必要なログ）</li>
            <li>
              アカウントなしのデモモードでは、Cookie / ローカルストレージ、またはセッション用の一時サーバー保存を使う場合があります
            </li>
          </ul>
        </section>
        <section>
          <h2>3. 利用目的</h2>
          <ul>
            <li>サービスの提供と改善</li>
            <li>エージェント実行、Needs You、レポートの運用</li>
            <li>プラン上限の適用と不正利用の防止</li>
            <li>サービス関連のお知らせ</li>
            <li>法令上の義務への対応</li>
          </ul>
        </section>
        <section>
          <h2>4. 委託先・第三者</h2>
          <p>次を利用する場合があります。</p>
          <ul>
            <li>インフラ・データベース（例: Supabase、Vercel）</li>
            <li>決済（Stripe）— 有料プラン加入時</li>
            <li>
              AI モデル提供者（例: OpenAI、Anthropic）— LLM 機能有効時、出力生成のためプロンプトと必要な文脈を送信することがあります
            </li>
          </ul>
          <p>個人情報を販売しません。</p>
        </section>
        <section id="cookies">
          <h2>5. Cookie とローカルストレージ</h2>
          <p>
            認証、セッション継続、言語などの設定のために<strong>必須</strong>の Cookie
            とローカルストレージを使います。サービス動作に必要です。
          </p>
          <p>
            分析・マーケ用 Cookie を後日導入する場合はここに記載し、必要な同意を取得します。現時点で非必須のトラッキング Cookie
            は使いません。
          </p>
        </section>
        <section>
          <h2>6. 保管期間</h2>
          <ul>
            <li>アカウントデータ: アカウントが有効な間</li>
            <li>利用・ログ: セキュリティ、請求、改善のため一定期間</li>
            <li>法令上の保管義務を除き、アカウントと関連データの削除を請求できます</li>
          </ul>
        </section>
        <section>
          <h2>7. あなたの権利</h2>
          <p>
            お住まいの地域により、アクセス・訂正・削除・エクスポート、または特定の処理への異議申し立ての権利がある場合があります。行使は{' '}
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> まで。
          </p>
        </section>
        <section>
          <h2>8. セキュリティ</h2>
          <p>
            合理的な技術的・組織的措置を講じます。通信・保存の完全な安全性は保証できません。
          </p>
        </section>
        <section>
          <h2>9. 国際転送</h2>
          <p>データは、当社または委託先が運営する国で処理される場合があります。</p>
        </section>
        <section>
          <h2>10. 変更</h2>
          <p>本ポリシーは更新することがあります。重要な変更は「最終更新」日で示します。</p>
        </section>
        <section>
          <h2>11. 連絡先</h2>
          <p>
            プライバシー関連: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <section>
        <h2>1. Who we are</h2>
        <p>
          Conductor (“we”, “us”) is an AI agent orchestration service. Contact:{' '}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li>Account information (email, name if provided via GitHub or magic link)</li>
          <li>Usage data (agent runs, Needs You decisions, approximate token usage, plan)</li>
          <li>Content you submit (research themes, instructions, decision responses)</li>
          <li>
            Technical data (browser type, approximate region, logs necessary for security and
            debugging)
          </li>
          <li>
            In Demo Mode without an account, data may be stored locally (cookies / local storage)
            or temporarily on our servers for the session
          </li>
        </ul>
      </section>
      <section>
        <h2>3. How we use information</h2>
        <ul>
          <li>To provide and improve the service</li>
          <li>To operate agent execution, Needs You decisions, and reports</li>
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
            AI model providers (e.g. OpenAI, Anthropic) when LLM features are enabled — prompts
            and necessary context may be sent to generate outputs
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>
      <section id="cookies">
        <h2>5. Cookies and local storage</h2>
        <p>
          We use <strong>essential</strong> cookies and local storage for authentication, session
          continuity, and preferences (for example demo session cookies, language, UI order). These
          are required for the service to function.
        </p>
        <p>
          Analytics or marketing cookies, if introduced later, will be described here and subject
          to consent where required. Today we do not use non-essential tracking cookies.
        </p>
      </section>
      <section>
        <h2>6. Data retention</h2>
        <ul>
          <li>Account data: retained while your account is active</li>
          <li>
            Usage and logs: retained for a limited period for security, billing, and improvement
          </li>
          <li>
            You may request deletion of your account and associated data subject to legal retention
            requirements
          </li>
        </ul>
      </section>
      <section>
        <h2>7. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, or export
          your data, and to object to certain processing. Contact us at{' '}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> to exercise these rights.
        </p>
      </section>
      <section>
        <h2>8. Security</h2>
        <p>
          We apply reasonable technical and organizational measures. No method of transmission or
          storage is 100% secure.
        </p>
      </section>
      <section>
        <h2>9. International transfers</h2>
        <p>
          Data may be processed in countries other than your own, including where our providers
          operate.
        </p>
      </section>
      <section>
        <h2>10. Changes</h2>
        <p>
          We may update this policy. Material changes will be indicated by updating the “Last
          updated” date.
        </p>
      </section>
      <section>
        <h2>11. Contact</h2>
        <p>
          For privacy requests: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        </p>
      </section>
    </>
  );
}

export function TermsBody({ locale }: { locale: Locale }) {
  if (locale === 'ja') {
    return (
      <>
        <section>
          <h2>1. サービス</h2>
          <p>
            Conductor は AI エージェントの指揮・監督ツールを提供します。Needs You（ヒューマンインザループ）と関連レポートを含みます。
          </p>
        </section>
        <section>
          <h2>2. 資格とアカウント</h2>
          <p>
            正確な情報を提供し、認証情報を安全に管理してください。アカウント上の行為は利用者の責任です。
          </p>
        </section>
        <section>
          <h2>3. 禁止事項</h2>
          <p>次を行わないことに同意します。</p>
          <ul>
            <li>法令または第三者の権利の侵害</li>
            <li>許可された利用を超える妨害やリバースエンジニアリング</li>
            <li>有害・違法・虐待的なコンテンツの生成・配信</li>
            <li>プラン上限やセキュリティ制御の回避</li>
          </ul>
        </section>
        <section>
          <h2>4. AI の出力</h2>
          <p>
            <strong>
              AI エージェントは誤った、不完全な、または誤解を招く出力を出すことがあります。
            </strong>{' '}
            出力に基づく判断と行為の責任は利用者にあります。正確性・完全性・特定目的適合性は保証しません。
          </p>
        </section>
        <section>
          <h2>5. プラン・料金・解約</h2>
          <ul>
            <li>
              無料・有料プランは <Link href="/#pricing">料金</Link> に記載
            </li>
            <li>有料サブスクリプションは解約まで更新されます</li>
            <li>料金は決済事業者（Stripe）経由で処理されます</li>
            <li>返金は購入時の方針または法令に従います</li>
          </ul>
        </section>
        <section>
          <h2>6. 知的財産</h2>
          <ul>
            <li>サービス、ブランド、ソフトウェアは当社またはライセンサーに帰属します</li>
            <li>
              提出コンテンツの権利は利用者に残り、サービス提供に必要な範囲で処理するライセンスを当社に付与します
            </li>
          </ul>
        </section>
        <section>
          <h2>7. 可用性・変更</h2>
          <p>
            機能の変更・停止・終了を行う場合があります。高い可用性を目指しますが、無停止は保証しません。
          </p>
        </section>
        <section>
          <h2>8. 免責</h2>
          <p>
            サービスは、法令で認められる最大限度で、明示・黙示を問わずいかなる保証もなく「現状有姿」で提供されます。
          </p>
        </section>
        <section>
          <h2>9. 責任制限</h2>
          <p>
            法令で認められる最大限度で、間接損害・逸失利益・データ損失などについて責任を負いません。有料プランにおける当社の総責任は、直前12か月に支払われた料金を上限とします。
          </p>
        </section>
        <section>
          <h2>10. 準拠法</h2>
          <p>
            別段の定めがない限り、適用法と紛争解決地は当社の主要事業所の所在地に従います。強行法規がある場合はそれに従います。
          </p>
        </section>
        <section>
          <h2>11. 連絡先</h2>
          <p>
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <section>
        <h2>1. Service</h2>
        <p>
          Conductor provides tools to orchestrate and supervise AI agents, including Needs You
          (human-in-the-loop) workflows and related reports.
        </p>
      </section>
      <section>
        <h2>2. Eligibility and accounts</h2>
        <p>
          You must provide accurate information and keep your credentials secure. You are
          responsible for activity under your account.
        </p>
      </section>
      <section>
        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Violate law or third-party rights</li>
          <li>Attempt to disrupt or reverse engineer the service beyond permitted use</li>
          <li>Use the service to generate or distribute harmful, illegal, or abusive content</li>
          <li>Circumvent plan limits or security controls</li>
        </ul>
      </section>
      <section>
        <h2>4. AI outputs</h2>
        <p>
          <strong>
            AI agents may produce incorrect, incomplete, or misleading outputs.
          </strong>{' '}
          You remain solely responsible for decisions and actions taken based on outputs from the
          service. Conductor does not guarantee accuracy, completeness, or fitness for a particular
          purpose.
        </p>
      </section>
      <section>
        <h2>5. Plans, fees, and cancellation</h2>
        <ul>
          <li>
            Free and paid plans are described on the <Link href="/#pricing">pricing</Link> section
          </li>
          <li>Paid subscriptions renew until cancelled</li>
          <li>Fees are handled via our payment provider (Stripe)</li>
          <li>Refunds are handled according to the policy stated at purchase or required by law</li>
        </ul>
      </section>
      <section>
        <h2>6. Intellectual property</h2>
        <ul>
          <li>The service, branding, and software are owned by us or our licensors</li>
          <li>
            You retain rights to content you submit; you grant us a license to process it solely to
            provide the service
          </li>
        </ul>
      </section>
      <section>
        <h2>7. Availability and changes</h2>
        <p>
          We may modify, suspend, or discontinue features. We aim for high availability but do not
          guarantee uninterrupted service.
        </p>
      </section>
      <section>
        <h2>8. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, TO THE
          MAXIMUM EXTENT PERMITTED BY LAW.
        </p>
      </section>
      <section>
        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for indirect, incidental, or
          consequential damages, lost profits, or data loss. Our aggregate liability for paid plans
          is limited to fees paid in the twelve months before the claim.
        </p>
      </section>
      <section>
        <h2>10. Governing law</h2>
        <p>
          Unless otherwise required, these terms are governed by the laws of our principal place of
          business. Mandatory consumer protections where you live still apply.
        </p>
      </section>
      <section>
        <h2>11. Contact</h2>
        <p>
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        </p>
      </section>
    </>
  );
}
