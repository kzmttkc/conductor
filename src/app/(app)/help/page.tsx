import Link from 'next/link';
import { Button } from '@/components/ui/button';

const concepts = [
  {
    title: 'Agents',
    body: 'Each agent has a role — researcher, writer, editor, and so on. They run tasks, log progress, and pause when they need your input.',
  },
  {
    title: 'Templates',
    body: 'Pre-built crews you can launch in one click. Free includes Solo Scout or Content Pipeline; upgrade for larger teams like Research Crew.',
  },
  {
    title: 'Needs You',
    body: 'When an agent hits a judgment call, it escalates to you. Review the context, approve or redirect, and the crew keeps moving.',
  },
  {
    title: 'Results',
    body: 'Finished work lands in Results — reports, drafts, and other deliverables your crew produced during the run.',
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Help</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Four ideas that explain how Conductor works.
        </p>
      </div>

      <div className="space-y-6">
        {concepts.map((item) => (
          <section key={item.title} className="surface rounded-xl p-5 space-y-2">
            <h2 className="font-medium">{item.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/templates">Browse templates</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
