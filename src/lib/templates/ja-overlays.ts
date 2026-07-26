import type { AgentDefinition } from '@/lib/supabase/types';
import type { Locale } from '@/i18n/types';

/** Display-only agent names (runtime keys stay EN: Scout, Verifier, …). */
export const AGENT_NAME_JA: Record<string, string> = {
  Scout: 'スカウト',
  Synthesizer: 'シンセサイザー',
  Verifier: 'ベリファイア',
  Watcher: 'ウォッチャー',
  BriefWriter: 'ブリーフライター',
  Drafter: 'ドラフター',
  Editor: 'エディター',
};

/** Display-only role labels (do not persist — runtime matches EN role strings). */
export const ROLE_JA: Record<string, string> = {
  Researcher: 'リサーチャー',
  Analyst: 'アナリスト',
  'Fact Checker': 'ファクトチェッカー',
  Writer: 'ライター',
  Editor: '編集者',
  Monitor: 'モニター',
  'Briefing Analyst': 'ブリーフィング・アナリスト',
};

export type AgentLabelOpts = {
  /** Per-agent overlay from config.display_name_ja */
  displayNameJa?: string | null;
  /** Workspace cookie / settings map runtimeName → JA label */
  customMap?: Record<string, string> | null;
};

type Overlay = { goal: string; system_prompt: string };

const AGENT_OVERLAY: Record<string, Overlay> = {
  'Scout|Researcher': {
    goal: 'テーマに関する一次ソースを集め、判断が必要なときにエスカレートする。',
    system_prompt:
      'あなたは熟練のリサーチャーです。信頼できる情報を集め出典を示してください。矛盾・不足・ペイウォールでは escalate_to_human を使ってください。最終成果は短い調査メモです。人間向けの summary / options / レポート本文は日本語で書いてください。ソースのタイトルを引用する場合のみ英語を残して構いません。',
  },
  'Synthesizer|Analyst': {
    goal: '収集した調査結果を、意思決定に使える構造化レポートにまとめる。',
    system_prompt:
      'あなたは情報を構造化するアナリストです。上流の調査を人が行動できるレポートに整理してください。優先順位が曖昧なときは escalate_to_human を使ってください。人間向けの文面は日本語で書いてください。',
  },
  'Verifier|Fact Checker': {
    goal: '重要主張を検証し、裏付けできない点を明示する。',
    system_prompt:
      'あなたは重要主張を検証します。弱い証拠に異議を唱え、裏付けできない実質的な主張は escalate_to_human で確認し、検証レポートを書いてください。人間向けの文面は日本語で書いてください。',
  },
  'Watcher|Monitor': {
    goal: 'テーマの競合・市場シグナルを集め、変化を表面化する。',
    system_prompt:
      'あなたは競合を監視します。公開ソースから変化・脅威・機会を URL 付きで抽出してください。矛盾や曖昧さでは escalate_to_human を使ってください。人間向けの文面は日本語で書いてください。',
  },
  'BriefWriter|Briefing Analyst': {
    goal: '監視結果を短い意思決定ブリーフィングにまとめる。',
    system_prompt:
      'あなたはエグゼクティブブリーフを書きます。上流の監視結果を意思決定向けの短いブリーフィングに要約してください。切り口の選択が重要なときだけ escalate_to_human を使ってください。人間向けの文面は日本語で書いてください。',
  },
  'Drafter|Writer': {
    goal: 'アウトラインと初稿を書き、事実が不明なときにエスカレートする。',
    system_prompt:
      'あなたは実務的なライターです。テーマの見出し付き初稿を書いてください。弱い主張は人間確認のため escalate_to_human を使ってください。人間向けの文面は日本語で書いてください。',
  },
  'Editor|Editor': {
    goal: '上流の草稿を読み、簡潔で正確な最終稿にする。',
    system_prompt:
      'あなたは編集者です。上流の草稿を読み、明瞭さと正確さのために整えてください。実質的な判断が残るときだけ escalate_to_human を使ってください。人間向けの文面は日本語で書いてください。',
  },
};

export function roleLabel(role: string, locale: Locale): string {
  if (locale !== 'ja') return role;
  return ROLE_JA[role] ?? role;
}

/**
 * Resolve display name. Order: config.display_name_ja → custom map → builtin → runtime name.
 * Never mutates the runtime agent.name used for matchers.
 */
export function agentLabel(
  name: string,
  locale: Locale,
  opts?: AgentLabelOpts
): string {
  if (locale !== 'ja') return name;
  const fromConfig = opts?.displayNameJa?.trim();
  if (fromConfig) return fromConfig;
  const fromMap = opts?.customMap?.[name]?.trim();
  if (fromMap) return fromMap;
  return AGENT_NAME_JA[name] ?? name;
}

export function displayNameJaFromConfig(
  config: Record<string, unknown> | null | undefined
): string | null {
  const v = config?.display_name_ja;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Apply JA goal/system_prompt overlays at launch (role stays EN for runtime). */
export function localizeAgentDefinition(
  def: AgentDefinition,
  locale: Locale
): AgentDefinition {
  if (locale !== 'ja') return def;
  const overlay =
    AGENT_OVERLAY[`${def.name}|${def.role}`] ?? AGENT_OVERLAY[def.name];
  if (!overlay) return def;
  return {
    ...def,
    goal: overlay.goal,
    system_prompt: overlay.system_prompt,
  };
}
