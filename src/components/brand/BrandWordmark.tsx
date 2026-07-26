import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'div';
};

/** Official wordmark: CONDUCTOR in brand geometric sans. */
export function BrandWordmark({ className, as: Tag = 'span' }: Props) {
  return (
    <Tag
      className={cn(
        'font-brand font-semibold uppercase tracking-[0.22em] text-[0.92em] leading-none',
        className
      )}
    >
      CONDUCTOR
    </Tag>
  );
}
