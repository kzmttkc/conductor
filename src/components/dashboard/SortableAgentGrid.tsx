'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Agent } from '@/lib/supabase/types';
import { AgentCard } from '@/components/agents/AgentCard';

const STORAGE_KEY = 'conductor-agent-order';

function SortableCard({
  agent,
  hasReport,
}: {
  agent: Agent;
  hasReport: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: agent.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.28)' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AgentCard
        agent={agent}
        hasReport={hasReport}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function SortableAgentGrid({
  agents,
  reportAgentIds,
}: {
  agents: Agent[];
  reportAgentIds: Set<string>;
}) {
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOrder(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const ordered = useMemo(() => {
    const byId = new Map(agents.map((a) => [a.id, a]));
    const ids = [
      ...order.filter((id) => byId.has(id)),
      ...agents.map((a) => a.id).filter((id) => !order.includes(id)),
    ];
    // Keep Needs You visually first among unordered newcomers, but respect saved order
    return ids.map((id) => byId.get(id)!).filter(Boolean);
  }, [agents, order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((a) => a.id === active.id);
    const newIndex = ordered.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(
      ordered.map((a) => a.id),
      oldIndex,
      newIndex
    );
    setOrder(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ordered.map((a) => a.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((agent) => (
            <SortableCard
              key={agent.id}
              agent={agent}
              hasReport={reportAgentIds.has(agent.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
