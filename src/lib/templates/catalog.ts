import type { AgentDefinition, Template } from '@/lib/supabase/types';
import researchCrew from '../../../templates/research-crew.json';
import competitorWatch from '../../../templates/competitor-watch.json';
import soloScout from '../../../templates/solo-scout.json';
import contentPipeline from '../../../templates/content-pipeline.json';

export const TEMPLATE_IDS = {
  researchCrew: '11111111-1111-4111-8111-111111111111',
  competitorWatch: '22222222-2222-4222-8222-222222222222',
  soloScout: '33333333-3333-4333-8333-333333333333',
  contentPipeline: '44444444-4444-4444-8444-444444444444',
} as const;

type Pack = {
  id: string;
  json: {
    name: string;
    description: string;
    agents: AgentDefinition[];
  };
  pipeline: boolean;
};

const pack: Pack[] = [
  { id: TEMPLATE_IDS.researchCrew, json: researchCrew as Pack['json'], pipeline: true },
  { id: TEMPLATE_IDS.competitorWatch, json: competitorWatch as Pack['json'], pipeline: true },
  { id: TEMPLATE_IDS.soloScout, json: soloScout as Pack['json'], pipeline: false },
  { id: TEMPLATE_IDS.contentPipeline, json: contentPipeline as Pack['json'], pipeline: true },
];

export function listBundledTemplates(): Template[] {
  return pack.map(({ id, json }) => ({
    id,
    name: json.name,
    description: json.description,
    agent_definitions: json.agents,
    is_public: true,
    created_at: new Date().toISOString(),
  }));
}

export function getBundledTemplate(id: string): (Template & { pipeline: boolean }) | null {
  const hit = pack.find((p) => p.id === id);
  if (!hit) return null;
  return {
    id: hit.id,
    name: hit.json.name,
    description: hit.json.description,
    agent_definitions: hit.json.agents,
    is_public: true,
    created_at: new Date().toISOString(),
    pipeline: hit.pipeline,
  };
}

export function isPipelineTemplate(id: string | null | undefined) {
  if (!id) return false;
  return Boolean(pack.find((p) => p.id === id)?.pipeline);
}
