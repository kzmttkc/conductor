# Conductor - Complete Master Package for Cursor / AI Agents

このパッケージは、AIエージェント・オーケストレーションSaaS「Conductor」を**一切の漏れなく**最高品質で再現するための完全な仕様・コード・プロンプト群です。

## 使い方（Cursor推奨）

1. このフォルダ全体をCursorワークスペースに読み込む
2. まず `00_MASTER_SPEC.md` をエージェントに読ませる
3. その後、`prompts/` 内の Phase順プロンプトを順番に実行する
4. `code/` 内の完成コード例を必要に応じてコピー・拡張する

## パッケージ構成

- `00_MASTER_SPEC.md` : 製品ビジョン・原則・全体仕様（最重要）
- `01_DATABASE.sql` : 正確なテーブル定義 + RLS
- `02_TYPES.ts` : TypeScript型定義
- `07_RESEARCH_CREW_TEMPLATE.json` : 初期テンプレート
- `docs/` : UI/UXガイドライン、価格、実装順序など
- `code/` : すぐに使える高品質コード例（hooks, components）
- `prompts/` : Cursorに直接渡すPhase別詳細プロンプト

## 実装順序（厳守）

Phase 0 → Phase 1 → Phase 2（エスカレーション最重要）→ Phase 3 → ... の順で進めること。

すべてのファイルは相互に整合性が取れています。
矛盾を発見した場合は `00_MASTER_SPEC.md` を最優先してください。
