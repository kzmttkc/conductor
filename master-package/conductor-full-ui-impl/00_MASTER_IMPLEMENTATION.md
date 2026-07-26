# Conductor Full UI Implementation Package
**対象**: 現在の v3 コードベース（Git 67936d8 相当）  
**目標**: Needs You moment の研ぎ澄まし + モバイル安定感 + AppShell/Dashboard を世界トップクラスに実装

## 実装範囲（すべて必須）

1. **Needs You moment（公開面）** の最終磨き
2. **モバイル安定感**の向上（safe-area / タッチターゲット / 下部タブ）
3. **AppShell**（Desktop サイドナビ + Mobile 下部タブ）
4. **Dashboard**（指揮台レイアウト + カード並び替え）

## 絶対ルール

- 既存の Runtime / Escalation API / Demo Mode / Pipeline / artifacts は**一切変更しない**
- UI層とナビゲーション・レイアウトのみを対象にする
- Needs You の視覚的優先度を常に最上位に保つ
- ライト（入口）とダーク（指揮・判断）の意図的対比を崩さない

## 実装順序

1. `prompts/01_NEEDS_YOU_MOMENT.md`
2. `prompts/02_APPSHELL.md`
3. `prompts/03_DASHBOARD.md`
4. `prompts/04_MOBILE_STABILITY.md`

各プロンプトを順番に Cursor に渡し、完了確認してから次に進むこと。
