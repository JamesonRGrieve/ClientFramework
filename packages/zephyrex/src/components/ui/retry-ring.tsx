// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

/** The ring's length in its own units (`pathLength`), so the gap is simply the share left. */
const RING = 100;
const VIEW = 24;
const CENTRE = VIEW / 2;
const RADIUS = 9;
const STROKE = 3;
/** How much of the ring shows while it spins during a try. */
const SPINNING_SHARE = 0.25;

/**
 * A ring that empties as a retry countdown runs, and spins while the try is under way. Decorative:
 * the countdown's words carry its meaning.
 */
export function RetryRing({
  secondsLeft,
  totalSeconds,
  retrying,
  className,
}: {
  secondsLeft: number;
  totalSeconds: number;
  retrying: boolean;
  className?: string;
}): ReactElement {
  const left = retrying ? RING * SPINNING_SHARE : (RING * secondsLeft) / totalSeconds;
  return (
    <svg
      viewBox={`0 0 ${String(VIEW)} ${String(VIEW)}`}
      aria-hidden='true'
      className={cn('size-4 -rotate-90', retrying && 'animate-spin motion-reduce:animate-none', className)}
    >
      <circle cx={CENTRE} cy={CENTRE} r={RADIUS} fill='none' strokeWidth={STROKE} className='stroke-current opacity-25' />
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RADIUS}
        fill='none'
        strokeWidth={STROKE}
        strokeLinecap='round'
        pathLength={RING}
        strokeDasharray={RING}
        strokeDashoffset={RING - left}
        className='stroke-current transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none'
      />
    </svg>
  );
}
