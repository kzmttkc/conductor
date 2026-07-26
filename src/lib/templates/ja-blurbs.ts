/** Japanese display overrides for template name/description (catalog stays EN for runtime). */

export const TEMPLATE_JA: Record<
  string,
  { name: string; description: string }
> = {
  '33333333-3333-4333-8333-333333333333': {
    name: 'ソロ・スカウト',
    description:
      'リサーチャー1体だけを指揮する最小テンプレート。Free で Needs You ループを体験するのに最適。',
  },
  '44444444-4444-4444-8444-444444444444': {
    name: 'コンテンツ・パイプライン',
    description:
      'ドラフト → 編集の2体パイプライン。前段の成果を次段が読みます。Free 向けコンテンツ制作ループ。',
  },
  '11111111-1111-4111-8111-111111111111': {
    name: '市場調査クルー',
    description:
      '市場調査を分担する3体チーム。指揮と判断の価値を最も体感しやすいテンプレート（Starter以上）。',
  },
  '22222222-2222-4222-8222-222222222222': {
    name: '競合ウォッチ',
    description:
      '2体で競合シグナルを監視・要約。コンパクトな Free 向け指揮体験。',
  },
};
