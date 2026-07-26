import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BrandMark } from './BrandMark';
import { BrandWordmark } from './BrandWordmark';

type Props = {
  className?: string;
  /** `composed` = SVG mark + type (adapts to theme). `image` = official lockup PNG. */
  variant?: 'composed' | 'image';
  markClassName?: string;
  wordmarkClassName?: string;
  wordmarkAs?: 'span' | 'p' | 'h1' | 'div';
  /** Image lockup size hint */
  size?: number;
  priority?: boolean;
};

/** Vertical lockup: mark above CONDUCTOR. */
export function BrandLockup({
  className,
  variant = 'composed',
  markClassName,
  wordmarkClassName,
  wordmarkAs = 'span',
  size = 160,
  priority = false,
}: Props) {
  if (variant === 'image') {
    return (
      <Image
        src="/brand/lockup.png"
        alt="Conductor"
        width={size}
        height={size}
        priority={priority}
        className={cn('select-none', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center gap-[0.55em]',
        className
      )}
    >
      <BrandMark className={cn('text-brand', markClassName)} />
      <BrandWordmark
        as={wordmarkAs}
        className={cn('text-brand', wordmarkClassName)}
      />
    </div>
  );
}

type InlineProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

/** Horizontal nav lockup: mark + wordmark. */
export function BrandInline({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: InlineProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark className={cn('h-7 w-7 shrink-0 text-brand', markClassName)} />
      {showWordmark && (
        <BrandWordmark
          className={cn('text-[0.95rem] text-brand', wordmarkClassName)}
        />
      )}
    </span>
  );
}
