# Conductor Backend — World-Class Upgrade Spec

**対象**: 現在の v3 コードベース  
**目標**: 信頼性・安全性・観測性・実行品質で世界トップクラスのバックエンドにする

## 現状の強み（活かす）

- Demo / Prod の分岐が綺麗
- `executeAgentPass` + AI SDK tools（web_search / escalate_to_human）
- artifacts による成果物永続化
- pipeline の概念（Scout → Synthesizer → Verifier）
- usage_stats / PLAN_LIMITS
- Inngest による resume の骨格
- Unified API paths

## 世界一にするために埋めるギャップ

1. **本番実行の信頼性**（Demo と同等以上に安定させる）
2. **パイプラインの本物の成果物受け渡し**（前段 artifact を次段が確実に読む）
3. **権限の強制**（require_approval / deny が実行時に必ず効く）
4. **プラン制限の厳密な適用**（agents + runs + tokens）
5. **イデムポテントな resume / 二重実行防止**
6. **構造化ログと失敗時の復旧**
7. **レート制限と悪用防止**
8. **Stripe webhook の堅牢化**

## 絶対ルール

- 既存の公開 API 契約を壊さない
- Demo Mode のゼロ設定体験を維持する
- UI は触らない（バックエンドのみ）
- 段階的に導入し、各 Phase で動作確認する

## 実装順序

1. 実行エンジンの強化（権限強制・イデムポテンシ・エラー分類）
2. パイプラインの正式な artifact handoff
3. プラン制限の厳密化
4. 観測性（structured logging + usage 精度）
5. セキュリティ（rate limit / input validation）
6. Stripe webhook の本番品質化
