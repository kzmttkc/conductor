import { inngest } from './client';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import { resumeProdAgent } from '@/lib/runtime/prod-runner';

export const resumeAgentAfterHuman = inngest.createFunction(
  { id: 'resume-agent-after-human' },
  { event: 'conductor/escalation.resolved' },
  async ({ event }) => {
    const { agentId, humanResponse, action } = event.data as {
      agentId: string;
      humanResponse: string;
      action?: string;
    };
    if (action === 'cancel') return { skipped: true };

    if (isDemoMode()) {
      await getDemoStore().resumeAgent(agentId, humanResponse);
      return { resumed: agentId, mode: 'demo' };
    }

    await resumeProdAgent(agentId, humanResponse);
    return { resumed: agentId, mode: 'prod' };
  }
);

export const inngestFunctions = [resumeAgentAfterHuman];
