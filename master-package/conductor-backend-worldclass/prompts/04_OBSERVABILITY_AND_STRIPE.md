# 04. 観測性 + Stripe 本番品質

## 観測性

### Structured logging
重要なイベントを一貫した形で残す:
- agent.start
- agent.tool_call
- agent.escalate
- agent.resume
- agent.complete
- agent.error
- pipeline.handoff
- plan.limit_hit

Demo では既存の agent_logs で十分。  
Prod では可能なら追加でサーバーログ（または簡易テーブル）に JSON で残す。

### Usage 精度
- `tokens_approx` は LLM の usage を優先
- tool_calls / escalations / agent_runs を過不足なくカウント
- Settings または内部 API で現在の usage を返せるようにする

### 失敗の追跡
- error 状態の agent について、直近の error ログを API で取得できるようにする

## Stripe Webhook の堅牢化

1. **署名検証を必須に**
2. **イデムポテント処理**
   - 同じ event id を二度処理しない
3. **plan 更新**
   - `usage_stats.plan` を正しく更新
   - 失敗時はリトライ可能なエラーを返す
4. **Customer Portal / Checkout Session** の作成 API がエラー時に明確なメッセージを返す

## 完了条件
- 主要な実行イベントが追える
- usage が現実的な数字になっている
- Stripe webhook が署名なし・二重送信に耐える
