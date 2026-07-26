# Cursor Prompt: AppShell 刷新

現在の `src/components/layout/AppShell.tsx` を以下の仕様で最高品質に書き換えてください。

## 要件

### Desktop (≥768px)
- 左サイドに幅 68px の固定ナビ
- アイコンのみ（lucide-react）
- ホバーで右側にツールチップ（または小さなラベル）
- アクティブ状態は背景の微細なハイライト + アイコン色変化
- Escalations に未対応数がある場合は赤ドット or 数字バッジ
- 下部に Settings / ユーザーアバター

ナビ項目（この順番で固定）:
1. LayoutDashboard → /dashboard
2. Bot → /agents
3. AlertTriangle → /escalations （バッジ）
4. FileText → /results
5. 下部に More（Templates + Settings）

### Mobile (<768px)
- サイドナビは非表示
- 画面最下部に固定タブバー（safe-area対応）
- タブは最大5つ
- Needs You タブに未対応数を赤で表示
- 現在のルートに応じてアクティブ状態を明確に

### 共通
- 既存の children をそのままメインコンテンツとして描画
- ヘッダーは最小限（ロゴ or ページタイトル + 右側に Needs You ショートカット）
- ダークモード完全対応
- トランジションは短く（150–200ms）

## 禁止事項
- 新しいルートを追加しない
- Demo Mode の動作を壊さない
- 既存の認証・セッションロジックを触らない

完了条件:
- デスクトップでサイドナビ、モバイルで下部タブが正しく切り替わる
- Escalations の未対応数がリアルタイムで反映される
- キーボードフォーカスとアクセシビリティの基本を守る
