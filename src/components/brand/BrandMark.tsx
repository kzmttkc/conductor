import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  title?: string;
  /** When true, wraps mark on official black tile (matches source art). */
  onBlack?: boolean;
};

/** Official Conductor mark — ring + baton. Uses currentColor unless onBlack. */
export function BrandMark({
  className,
  title = 'Conductor',
  onBlack = false,
}: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn(onBlack && 'rounded-[18%] bg-black text-[#001444]', className)}
      role="img"
      aria-label={title}
      fill="none"
    >
      {onBlack && <rect width="64" height="64" fill="#000000" />}
      <g transform="translate(32 32)">
        <circle r="14.5" stroke="currentColor" strokeWidth="6.2" />
        <line
          x1="-13.2"
          y1="13.2"
          x2="13.2"
          y2="-13.2"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
