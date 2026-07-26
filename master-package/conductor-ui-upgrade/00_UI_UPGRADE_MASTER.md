# Conductor UI/UX Upgrade — Precise Implementation Spec (v3 base)

**目標**: 現在の強いコア（Escalation / Demo / Runtime / Pipeline）を一切壊さず、  
「世界トップクラスの指揮台UI」に引き上げる。

## 絶対に守る原則

1. **認知負荷の最小化** — 同時に見せる情報を「今必要なもの」だけにする
2. **Needs You が常に最優先** — 未対応エスカレーションがある限り、視覚的に最も強く主張する
3. **1画面の主CTAは原則1つ**
4. **複雑さを隠す** — 権限・ログ・パイプラインは必要になるまで深く見せない
5. **一貫性** — スペーシング・角丸・影・タイポを全画面で統一
6. **既存のAPI・データモデル・Demo Modeは変更しない**（UI層のみ）

## ナビゲーション方針（必須）

### Desktop
- 極細サイドナビ（幅 64–72px、アイコンのみ）
- ホバーでツールチップ
- 項目（最大5）:
  1. Dashboard（指揮台）
  2. Agents
  3. Escalations（未対応数バッジ）
  4. Results
  5. More（Templates / Settings を内包）

### Mobile / Tablet
- **画面下部固定タブ**（最大5）
  - Dashboard
  - Agents
  - Needs You（赤ドット）
  - Results
  - More

下部タブに集約することで片手操作と認知負荷を下げる。

## ダッシュボード（指揮台）の要件

- 3秒で全体状況がわかること
- 上部または目立つ位置に「Needs You」サマリー
- エージェントカードはドラッグで並び替え可能（localStorageに順序を保存）
- カードは状態色を強く出す（waiting_human は特に）
- 主CTAは「Launch template」または「Resolve needs」

## Escalation 画面

現状の良い点を維持しつつ：
- 選択肢の選択状態をより明確に
- キーボードショートカットを常時小さく表示
- 回答後の遷移をスムーズに（Resuming → Dashboard or Results）

## 実装順序（厳守）

1. AppShell（サイド + 下部タブ）の刷新
2. Dashboard の指揮台レイアウト
3. エージェントカードのドラッグ並び替え
4. EscalationDecision の最終調整
5. Results の安定感向上
6. 細かいマイクロインタラクション

既存の `src/components/layout/AppShell.tsx` と `DashboardView` をベースに改修すること。
新しいルーティング体系は作らない。
