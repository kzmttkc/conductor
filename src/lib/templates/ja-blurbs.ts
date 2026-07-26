/** Japanese display overrides for template name/description (catalog stays EN for runtime). */

export const TEMPLATE_JA: Record<
  string,
  { name: string; description: string }
> = {
  '33333333-3333-4333-8333-333333333333': {
    name: 'ソロ・スカウト',
    description:
      'リサーチャー1体だけ。Free で要判断の流れを短く試せます。',
  },
  '44444444-4444-4444-8444-444444444444': {
    name: 'コンテンツ・パイプライン',
    description:
      'ドラフト → 編集の2体。前段の成果を次段が読みます（Free）。',
  },
  '11111111-1111-4111-8111-111111111111': {
    name: '市場調査チーム',
    description:
      '調査を分担する3体。指揮と判断を試す本命テンプレート（Starter以上）。',
  },
  '22222222-2222-4222-8222-222222222222': {
    name: '競合ウォッチ',
    description: '2体で競合シグナルを監視・要約します（Free）。',
  },
};
