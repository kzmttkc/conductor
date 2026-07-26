import { inngest } from './client';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';

/**
 * Resume an agent after a human resolves an escalation.
 * In production this would wake a LangGraph checkpoint; in demo it drives the local runtime.
 */
export const resumeAgentAfterHuman = inngest.createFunction(
  { id: 'resume-agent-after-human' },
  { event: 'conductor/escalation.resolved' },
  async ({ event, step }) => {
    const { agentId, humanResponse } = event.data as {
      agentId: string;
      humanResponse: string;
    };

    await step.run('resume-runtime', async () => {
      if (isDemoMode()) {
        getDemoStore().resumeAgent(agentId, humanResponse);
      }
      // Production: load LangGraph checkpoint and continue with humanResponse injected.
      return { agentId, resumed: true };
    });

    return { ok: true };
  }
);

export const inngestFunctions = [resumeAgentAfterHuman];
