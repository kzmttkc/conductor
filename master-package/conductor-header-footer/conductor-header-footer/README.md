# Conductor Header & Footer Package

適切なヘッダー・フッターと法的ページの骨子です。

## 含まれるもの

- `00_HEADER_FOOTER_SPEC.md` … 全体仕様
- `content/PRIVACY_DRAFT.md` … Privacy Policy 草案
- `content/TERMS_DRAFT.md` … Terms of Service 草案
- `code/SiteHeader.tsx` … 公開ヘッダー実装例
- `code/SiteFooter.tsx` … 公開フッター実装例

## 使い方

1. 公開レイアウトに `SiteHeader` / `SiteFooter` を配置
2. `/privacy` と `/terms` ページを作成し、草案をベースにメールアドレス等を埋める
3. App内（dashboard 以降）ではこのフッターを出さない
4. Contact の mailto を実際のサポートアドレスに変更

## 注意

- 法的文書は草案です。本格運用前に必要に応じて専門家レビューを推奨
- AI出力の免責は Terms に必ず残す
- 日本法準拠の記載を草案に含めています（必要に応じて調整）
