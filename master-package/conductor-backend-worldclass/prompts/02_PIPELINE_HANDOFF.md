# 02. パイプライン成果物ハンドオフの正式実装

対象: テンプレート起動・runtime・artifacts

## 目的
Scout → Synthesizer → Verifier が「本当に前段の成果物を読んで次の仕事をする」ようにする。

## 必須実装

### 1. パイプライン定義の明示
- `isPipelineTemplate` が true のテンプレートでは、エージェント順序を保証する
- 起動時に `config.pipeline_index` と `config.pipeline_id`（共通の run id）を付与

### 2. 前段完了待ち
- index > 0 のエージェントは、前段が `completed` かつ artifact が存在するまで開始しない
- 前段が `error` または `cancelled` の場合は後段を `idle` のまま止めるか、明示的にスキップする

### 3. Artifact の受け渡し
- 後段開始時に、前段の最新 artifact の `content_markdown` を context に注入
- LLM / structured pass の両方で「Upstream report:」として渡す
- ログに `handoff` タイプまたは metadata で記録

### 4. 全体の完了
- パイプライン最後のエージェントが completed になったら、必要なら summary artifact を残す（任意）

## 完了条件
- Research Crew を起動すると Scout 完了 → Synthesizer が Scout のレポートを読んで動く
- 前段が失敗した場合に後段が無意味に走り出さない
