# 02. AppShell 実装（Desktop + Mobile）

対象: `src/components/layout/AppShell.tsx` および関連レイアウト

## 目的
認知負荷を最小化し、どこにいても「Needs You」に素早く到達できる指揮台ナビゲーションを実現する。

## Desktop（md以上）

- 左固定サイドレール（幅 68–72px）
- アイコンのみ（lucide-react）
- ホバーでツールチップ
- アクティブ時は背景の微細ハイライト
- 項目（この順番で固定）:
  1. LayoutDashboard → /dashboard
  2. Bot → /agents
  3. AlertTriangle → /escalations（未対応数バッジ必須）
  4. FileText → /results
  5. 下部に MoreHorizontal → /settings または Templates/Settings をまとめる

- メインコンテンツは `pl-[68px]` などでサイドの幅を確保
- Escalations の未対応数が 0 より大きいとき、赤バッジを必ず表示

## Mobile（md未満）

- サイドレールは非表示
- **画面最下部に固定タブバー**
  - safe-area-pb 対応（iPhone 下部の余白）
  - 高さ 56px 前後
  - タブ: Dashboard / Agents / Needs You / Results / More
  - Needs You に未対応がある場合は赤ドット
- メインコンテンツの下部にタブの高さ分の padding を追加し、コンテンツが隠れないようにする

## 共通

- 既存の children をそのまま描画
- ヘッダーは最小限（必要ならページタイトル + 右側に Needs You ショートカット）
- ダークモード完全対応
- トランジションは 150–200ms

## 禁止
- 新しいルート追加禁止
- 認証・Demo Mode ロジックを触らない
- データ取得を AppShell 内で複雑にしない（pending数は props か既存 hook で受け取る）

## 完了条件
- Desktop でサイドナビ、Mobile で下部タブが正しく切り替わる
- 未対応 Escalation 数がバッジ/ドットで見える
- どの画面からでも Needs You に1タップ/1クリックで行ける
