# 03. プラン制限の厳密化 + セキュリティ

## プラン制限

### 必須チェックポイント
1. **エージェント数**
   - create / launchTemplate の直前に `assertAgentCapacity` を必ず通す
   - 超過時は 403 + `{ code: 'PLAN_LIMIT', upgrade_to: 'starter' | ... }`

2. **月次 runs / tokens**
   - `usage_stats` を実行開始時と完了時に更新
   - Soft limit を超えたら警告ログ、Hard limit（例: 120%）で新規実行を拒否

3. **Free の厳格化**
   - Free はエージェント2体 + 低い runs 上限を確実に守る
   - 公開 Demo は別枠（visitor）として制限を緩くしてよいが、ログイン後は厳密に

### 実装方針
- 制限チェックは API 層（`/api/agents`, launch）に集約
- Runtime 内でも最終防衛として再チェックしてもよい

## セキュリティ

1. **入力検証**
   - theme / summary / options の長さ制限
   - XSS になりうる文字列のサニタイズ（特に artifact 表示前）

2. **Rate limiting（最低限）**
   - 同一 user / IP での launch・resolve に簡易レート制限
   - Demo visitor にも甘めの制限を入れる

3. **権限の再確認**
   - escalation resolve 時に、その escalation が本当に自分の agent のものか再検証

4. **Service role の使用範囲**
   - Stripe webhook 以外で service role を安易に使わない

## 完了条件
- Free ユーザーが3体目を作れない
- runs 上限超過で新規実行が拒否される
- 他人の escalation を resolve できない
