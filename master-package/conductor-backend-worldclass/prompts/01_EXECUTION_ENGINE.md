# 01. 実行エンジンの世界一化

対象: `src/lib/runtime/executor.ts`, `llm.ts`, 関連 API

## 目的
エージェント実行を「デモでも本番でも同じ品質」にし、権限・失敗・再開を厳密に扱う。

## 必須実装

### 1. 権限の強制（必須）
- ツール実行前に必ず `permissions[tool]` を確認
- `deny` → 実行せずログに `permission_denied`
- `require_approval` → 自動で escalation を作成し status を `waiting_human` に
- `allow` → 実行
- 既存の `normalizePermission` を活用

### 2. 実行のイデムポテンシ
- 同じ agent に対する同時実行を防ぐ（簡易ロック or status チェック）
- `status === 'running'` のエージェントに再実行が来たら 409 または無視
- escalation resolve 後の resume は一度だけ実行されること

### 3. エラー分類
実行失敗を以下に分類してログと status に反映:
- `tool_error`
- `llm_error`
- `permission_denied`
- `timeout`
- `cancelled`

status を `error` にする場合は `current_task` に短い理由を入れる。

### 4. タイムアウト
- 1 pass に最大実行時間（例: 90–120秒）を設ける
- 超えたら graceful に停止し escalation または error にする

### 5. Demo / Prod 共通インターフェース
- `ExecutorSink` の契約を維持しつつ、上記を両方のパスで満たす
- DemoStore と Supabase 書き込みの両方で同じ挙動になること

## 完了条件
- require_approval のツールが必ず人間にエスカレーションされる
- 二重実行が起きない
- 失敗理由がログと status から追える
