# Conductor Backend — World-Class Upgrade Package

バックエンドを「世界一の品質と機能性」に引き上げるための精密実装パッケージです。

## 対象ギャップ

1. 実行エンジンの信頼性（権限強制・イデムポテンシ・エラー分類）
2. パイプラインの正式な artifact handoff
3. プラン制限の厳密化 + セキュリティ
4. 観測性 + Stripe webhook の本番品質

## 使い方（Cursor）

1. このフォルダをワークスペースに入れる
2. `00_BACKEND_MASTER.md` を最初に読ませる
3. 順番に実行:

```
prompts/01_EXECUTION_ENGINE.md
prompts/02_PIPELINE_HANDOFF.md
prompts/03_PLAN_LIMITS_AND_SECURITY.md
prompts/04_OBSERVABILITY_AND_STRIPE.md
```

4. `code/runtime/permission-guard.ts` を executor に統合する参考として使用

## 原則

- 既存の公開 API 契約を壊さない
- Demo Mode のゼロ設定体験を維持
- UI は触らない
- 段階的に導入し、各 Phase で動作確認

これで Conductor のバックエンドは「指揮を信頼して預けられる」水準に到達します。
