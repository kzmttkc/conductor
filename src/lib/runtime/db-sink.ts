import type { Agent, ToolName } from '@/lib/supabase/types';
import { normalizePermission } from '@/lib/supabase/types';
import type { ExecutorSink } from '@/lib/runtime/executor';
import * as data from '@/lib/supabase/data';

export function createDbSink(agent: Agent): ExecutorSink {
  let latest: Agent = agent;

  return {
    log: (type, content, metadata = {}) => {
      void data.insertLog(latest.id, type, content, metadata);
    },
    setStatus: (status, currentTask) => {
      void data
        .updateAgent(latest.id, {
          status,
          ...(currentTask !== undefined ? { current_task: currentTask } : {}),
        })
        .then((a) => {
          latest = a;
        });
    },
    escalate: (summary, options, context) => {
      void data.insertEscalation({
        agent_id: latest.id,
        summary,
        options,
        context,
      });
      void data.bumpUsage(latest.user_id, { escalations: 1 });
    },
    saveReport: (title, markdown) => {
      void data.insertArtifact({
        agent_id: latest.id,
        user_id: latest.user_id,
        title,
        content_markdown: markdown,
      });
    },
    trackUsage: (delta) => {
      void data.bumpUsage(latest.user_id, delta);
    },
    getPermission: (tool: ToolName) => {
      return normalizePermission(latest.permissions?.[tool]);
    },
  };
}

/** Awaitable sink — preferred for request-scoped runs (ensures writes finish). */
export function createAwaitableDbSink(agent: Agent): ExecutorSink & {
  flush: () => Promise<void>;
  getAgent: () => Agent;
} {
  let latest = agent;
  const pending: Promise<unknown>[] = [];

  const track = <T>(p: Promise<T>) => {
    pending.push(p);
    return p;
  };

  const sink: ExecutorSink & { flush: () => Promise<void>; getAgent: () => Agent } = {
    log: (type, content, metadata = {}) => {
      track(data.insertLog(latest.id, type, content, metadata));
    },
    setStatus: (status, currentTask) => {
      track(
        data
          .updateAgent(latest.id, {
            status,
            ...(currentTask !== undefined ? { current_task: currentTask } : {}),
          })
          .then((a) => {
            latest = a;
          })
      );
    },
    escalate: (summary, options, context) => {
      track(
        data.insertEscalation({
          agent_id: latest.id,
          summary,
          options,
          context,
        })
      );
      track(data.bumpUsage(latest.user_id, { escalations: 1 }));
    },
    saveReport: (title, markdown) => {
      track(
        data.insertArtifact({
          agent_id: latest.id,
          user_id: latest.user_id,
          title,
          content_markdown: markdown,
        })
      );
    },
    trackUsage: (delta) => {
      track(data.bumpUsage(latest.user_id, delta));
    },
    getPermission: (tool) => normalizePermission(latest.permissions?.[tool]),
    flush: async () => {
      await Promise.all(pending);
    },
    getAgent: () => latest,
  };

  return sink;
}
