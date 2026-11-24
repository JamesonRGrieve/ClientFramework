'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactElement, useId } from 'react';
import { DENSITIES, type Density } from './density';
import { useDensity } from './useDensity';

const CHOICES: Readonly<Record<Density, { label: string; hint: string; rows: readonly string[]; bar: string }>> = {
  sparse: { label: 'Sparse', hint: 'Room to breathe, easier to tap', rows: ['r1', 'r2'], bar: 'h-3' },
  comfortable: { label: 'Comfortable', hint: 'More room around each control', rows: ['r1', 'r2', 'r3'], bar: 'h-2' },
  compact: { label: 'Compact', hint: 'More on screen at once', rows: ['r1', 'r2', 'r3', 'r4', 'r5'], bar: 'h-1' },
};

/**
 * The density choice as a pair of native radios beside the theme picker, each with a small preview
 * of rows at its spacing. The choice is kept in the `density` cookie; pass `initialDensity` from the
 * server's read of it, so the server render marks the person's choice.
 */
export function DensityPicker({
  initialDensity,
  label = 'Density',
}: {
  initialDensity?: string | undefined;
  /** Names the group (its legend, read by screen readers; a visible heading above can say it too). */
  label?: string;
}): ReactElement {
  const { density, setDensity } = useDensity(initialDensity);
  const name = useId();
  return (
    <fieldset className='grid grid-cols-3 gap-3 sm:max-w-xl'>
      <legend className='sr-only'>{label}</legend>
      {DENSITIES.map((choice) => (
        <label
          key={choice}
          className='grid cursor-pointer gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted has-checked:border-primary has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-2 has-focus-visible:ring-ring'
        >
          <input
            type='radio'
            name={name}
            value={choice}
            checked={choice === density}
            onChange={() => setDensity(choice)}
            className='sr-only'
          />
          {/* The preview: the same height holds two rows when sparse, three when comfortable, five when compact. */}
          <span aria-hidden className='grid h-14 content-start gap-1 overflow-hidden rounded-md border bg-background p-2'>
            {CHOICES[choice].rows.map((row) => (
              <span key={row} className={`${CHOICES[choice].bar} w-full rounded-full bg-muted-foreground`} />
            ))}
          </span>
          <span className='font-medium'>{CHOICES[choice].label}</span>
          <span className='text-xs text-muted-foreground'>{CHOICES[choice].hint}</span>
        </label>
      ))}
    </fieldset>
  );
}
