# Conductor Full UI Implementation Package

Needs You moment の研ぎ澄まし、モバイル安定感、AppShell、Dashboard をすべて実装するための精密パッケージです。

## 使い方（Cursor）

1. このフォルダをワークスペースに入れる
2. `00_MASTER_IMPLEMENTATION.md` を最初に読ませる
3. 以下の順番でプロンプトを実行する：

```
prompts/01_NEEDS_YOU_MOMENT.md
prompts/02_APPSHELL.md
prompts/03_DASHBOARD.md
prompts/04_MOBILE_STABILITY.md
```

4. `code/appshell/CommandNav.tsx` は AppShell に統合する参考実装

## 設計の要点

- 入口（Landing / Demo / Login）はライト
- 指揮・判断（Needs You / App内）はダーク寄りで緊張感
- Desktop = 極細サイドナビ
- Mobile = 下部タブ（Needs You に赤ドット）
- Dashboard = 指揮台（Needs You バー最優先 + カード並び替え）
- 既存コア（Runtime / API / Demo Mode）は一切変更しない

これで「世界トップクラスへの最後の一歩」を実装できます。
