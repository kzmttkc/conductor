'use client';

import { cn } from '@/lib/utils';

/** Lightweight markdown-ish renderer for agent reports (no extra deps). */
export function MarkdownReport({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  const blocks = markdown.replace(/\r\n/g, '\n').split(/\n{2,}/);

  return (
    <div className={cn('space-y-4 text-[15px] leading-relaxed', className)}>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={i} className="font-display text-2xl tracking-tight pt-2">
              {inline(trimmed.slice(2))}
            </h2>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="font-medium text-lg pt-1">
              {inline(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="font-medium text-base text-foreground/90">
              {inline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('---')) {
          return <hr key={i} className="border-border" />;
        }
        if (/^[-*] /.test(trimmed) || trimmed.includes('\n- ') || trimmed.includes('\n* ')) {
          const items = trimmed.split('\n').filter((l) => /^[-*] /.test(l.trim()));
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              {items.map((item, j) => (
                <li key={j} className="text-foreground/85">
                  {inline(item.replace(/^[-*] /, ''))}
                </li>
              ))}
            </ul>
          );
        }
        if (/^\d+\. /.test(trimmed) || /\n\d+\. /.test(trimmed)) {
          const items = trimmed.split('\n').filter((l) => /^\d+\. /.test(l.trim()));
          return (
            <ol key={i} className="list-decimal pl-5 space-y-2 text-foreground/85">
              {items.map((item, j) => (
                <li key={j}>{inline(item.replace(/^\d+\. /, ''))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={i} className="text-foreground/85 whitespace-pre-wrap">
            {inline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[13px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
