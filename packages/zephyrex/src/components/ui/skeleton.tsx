// SPDX-License-Identifier: AGPL-3.0-or-later
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted motion-reduce:animate-none', className)} {...props} />;
}

/** Widths the placeholder lines cycle through, so the rows look like text rather than bars. */
const LINE_WIDTHS = ['w-2/5', 'w-1/3', 'w-1/2', 'w-1/4'] as const;

/**
 * A list's shape while it loads: `rows` placeholder rows, each with an optional round avatar and
 * two lines. Announced once as "Loading" to assistive technology; the rows themselves are hidden.
 */
function SkeletonRows({
  rows = 4,
  avatar = false,
  label = 'Loading',
  className,
}: {
  rows?: number;
  avatar?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div role='status' aria-busy='true' className={cn('divide-y rounded-lg border', className)}>
      <span className='sr-only'>{label}</span>
      {Array.from({ length: rows }, (_, row) => row).map((row) => (
        <div key={row} aria-hidden='true' className='flex items-center gap-3 px-4 py-3'>
          {avatar && <Skeleton className='size-8 shrink-0 rounded-full' />}
          <div className='grid flex-1 gap-1.5'>
            <Skeleton className={cn('h-3.5', LINE_WIDTHS[row % LINE_WIDTHS.length])} />
            <Skeleton className='h-3 w-1/5 opacity-60' />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonRows };
