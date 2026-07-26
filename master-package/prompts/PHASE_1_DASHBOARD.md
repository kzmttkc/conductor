# Phase 1: Dashboard + Realtime Prompt

`00_MASTER_SPEC.md` と `code/` 内のコードを参考に、以下を最高品質で実装してください。

必須実装：
1. `hooks/useAgents.ts`（Realtime対応）を完成させる
2. `AgentStatusBadge` と `AgentCard` を実装（提供コードをベースに洗練）
3. ダッシュボードページを実装
   - 全体ステータス（Running数 / Needs You数）
   - エージェントカードのグリッド表示
   - waiting_human のエージェントを視覚的に強く強調
4. 空状態とローディング状態を美しく実装

UI基準：LinearやVercelダッシュボード級の余白・タイポグラフィ・状態表現を目指す。

完了条件：
- ダミーデータを手動で入れたときにRealtimeで状態が変わる
- 「Needs You」が一目でわかる
