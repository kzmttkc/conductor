# 03. Dashboard 指揮台実装

対象: `src/components/dashboard/DashboardView.tsx` および関連

## 目的
3秒で全体状況がわかり、必要な介入にすぐ到達できる「指揮台」にする。

## レイアウト

1. **最上部 Status / Needs You バー**
   - 未対応 Escalation が1件以上ある場合、赤いコマンドバーを最優先で表示
   - 「N Needs You」+ 「Decide」ボタンで該当 Escalation へ直接遷移

2. **エージェントカードグリッド**
   - レスポンシブ（1列 → 2列 → 3列）
   - waiting_human のカードを最も強く視覚化（ボーダー or 背景の強調 + pulse）
   - カードクリックでエージェント詳細へ

3. **ドラッグ並び替え**
   - @dnd-kit または軽量な実装でカード順序を変更可能に
   - 順序は localStorage（キー: `conductor-agent-order`）に保存
   - リロード後も順序を復元

4. **空状態**
   - エージェント0件のときは「Launch a template」を主CTAとして大きく表示
   - Templates への導線を明確に

5. **下段**
   - 最近の Escalation または最近の Results への軽い導線（メインにしない）

## UIルール
- 主CTAは画面内で原則1つ
- 情報密度は詰め込みすぎない（Comfortable）
- 既存の AgentStatusBadge / AgentCard を活用しつつ、指揮台として再構成

## 禁止
- useAgents などのデータ取得ロジックを壊さない
- 新しいAPIを作らない
- Demo Mode の動作を変えない

## 完了条件
- Needs You があるときに赤いバーが確実に出る
- カードをドラッグして順序が保存・復元される
- モバイルでもカードが押しやすく、レイアウトが崩れない
