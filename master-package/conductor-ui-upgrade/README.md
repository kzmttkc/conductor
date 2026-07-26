# Conductor UI Upgrade Package (for v3 codebase)

現在の Conductor v3 を「世界トップクラスの指揮台UI」に引き上げるための精密指示パッケージです。

## 使い方（Cursor）

1. このフォルダをワークスペースに入れる
2. まず `00_UI_UPGRADE_MASTER.md` を読ませる
3. その後、順番にプロンプトを実行する：
   - `prompts/01_APPSHELL.md`
   - `prompts/02_DASHBOARD.md`
   - `prompts/03_ESCALATION_POLISH.md`
4. `code/AppShell.nav.example.tsx` は参考実装として利用

## 重要

- 既存のコア（Runtime / Escalation API / Demo Mode / Pipeline）は**一切変更しない**
- UI層とナビゲーション・レイアウトのみを対象にする
- Needs You の視覚的優先度を常に最上位に保つ

## 完了の定義

- デスクトップ：極細サイドナビ
- モバイル：下部タブナビ
- ダッシュボードが「指揮台」として機能する
- カードの並び替えが可能
- Escalation 画面が判断に集中できる完成度になっている
