# Conductor Header & Footer Specification

## 設計方針

- **入口（Landing / Demo / Login）**: ライト・開放的。ヘッダーは最小限、フッターは法的・信頼感を担保
- **App内（Dashboard 以降）**: 指揮台。ヘッダーは極力薄く、メインはサイド/下部ナビに任せる
- 法的ページは早期から用意し、信頼とコンプライアンスの最低ラインを満たす
- ソロ運営でも「ちゃんとしている」印象を出せる簡潔さを優先

---

## 1. 公開面ヘッダー（Landing / Demo / Login 共通）

### 構成
```
[Logo: Conductor]                    [Needs You]  [Sign in]  or  [Try live demo]
```

### 項目と機能
| 要素 | 内容 | 機能 |
|------|------|------|
| Logo | 「Conductor」テキスト or シンプルマーク | `/` へリンク |
| Needs You | テキストリンク or 小さなボタン | `/demo/moment` へ（製品の顔を見せる） |
| 主CTA | 「Try live demo — no signup」または「Sign in」 | `/demo` または `/login` |
| ログイン済みの場合 | 「Open Dashboard」 | `/dashboard` |

### ルール
- スクロールしても薄く固定（optional）
- モバイルではロゴ + ハンバーガー or 主CTAのみに省略可
- 余計なナビ項目は置かない（Product / Pricing / Blog はまだ増やさない）

---

## 2. App内ヘッダー

- ロゴは小さく左上（サイドナビがある場合は省略可）
- 右側: 未対応 Needs You 数のバッジ + ユーザーメニュー（Settings / Sign out）
- 高さは薄く（48–56px）
- 指揮の邪魔をしないこと

---

## 3. フッター（公開面メイン）

### 構成（推奨）

```
Conductor
One human. A crew of agents.

Product          Legal             Account
---------        -----             -------
Live demo        Privacy Policy    Sign in
Needs You moment Terms of Service  Contact
Pricing          Cookie notice     

© 2026 Conductor. All rights reserved.
```

### 各項目の内容・機能

#### Product
| リンク | 行き先 | 役割 |
|--------|--------|------|
| Live demo | `/demo` | ワンクリック体験 |
| Needs You moment | `/demo/moment` | 製品の核心を共有 |
| Pricing | `/#pricing` または `/pricing` | プランの透明性 |

#### Legal（必須）
| リンク | 行き先 | 役割 |
|--------|--------|------|
| Privacy Policy | `/privacy` | 個人情報の取り扱い |
| Terms of Service | `/terms` | 利用規約 |
| Cookie notice | `/privacy#cookies` または簡易バナー | Cookie使用の説明 |

#### Account
| リンク | 行き先 | 役割 |
|--------|--------|------|
| Sign in | `/login` | 認証 |
| Contact | `mailto:support@...` または `/contact` | 問い合わせ |

#### コピーライト
- `© 2026 Conductor. All rights reserved.`
- 運営者が個人の場合は「Operated by [Name]」を小さく追加しても良い

### フッターに入れないもの（初期）
- 複雑な会社情報（住所・登記）※必要になるまで省略可
- SNS大量リンク
- ニュースレター登録（後で追加）

---

## 4. 法的ページの最低限内容

### Privacy Policy（必須項目）
1. 運営者・連絡先
2. 収集する情報（メール、利用データ、Demo 時のローカルデータなど）
3. 利用目的
4. 第三者提供（Stripe、Supabase、LLMプロバイダの有無）
5. Cookie / ローカルストレージ
6. データの保存期間と削除
7. ユーザーの権利（開示・削除請求）
8. 改定について
9. 問い合わせ先

### Terms of Service（必須項目）
1. サービスの説明
2. アカウントと利用資格
3. 禁止事項
4. 知的財産
5. 料金・解約（有料プランがある場合）
6. 免責・責任制限（AI出力の性質を明記）
7. サービスの変更・終了
8. 準拠法・管轄（日本法を推奨）
9. 問い合わせ先

### 重要な一文（Terms に入れる）
> AI agents may produce incorrect or incomplete outputs. You remain responsible for decisions made using the service.

---

## 5. 実装上の注意

- 法的ページはまずは静的（MDX / シンプルな React ページ）で十分
- フッターは公開レイアウト（`(marketing)` や root layout の公開部分）に配置
- App内ではフッターを出さない、または極小にする
- Cookie バナーは「必須Cookieのみ」なら簡易で可。分析を入れる場合は同意取得を検討

---

## 6. 優先実装順

1. 公開ヘッダーの整理（Logo + Needs You + CTA）
2. フッターコンポーネント + リンク
3. `/privacy` と `/terms` の骨子ページ
4. App内ヘッダーの薄型化（既存と整合）
