// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactElement, type ReactNode, useCallback, useMemo, useState } from 'react';
import { Button } from './button';

/** Which rows of a list are ticked, by id, and the ways to change that. */
export interface RowSelection {
  chosen: ReadonlySet<string>;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Ticks every id given, or clears them all when every one is already ticked. */
  toggleAll: (ids: readonly string[]) => void;
  clear: () => void;
}

/** Row selection for a list: tick rows, then act on them all through a SelectionBar. */
export function useSelection(): RowSelection {
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  const toggleAll = useCallback((ids: readonly string[]) => {
    setChosen((current) => (ids.every((id) => current.has(id)) ? new Set() : new Set(ids)));
  }, []);
  const clear = useCallback(() => setChosen(new Set()), []);
  return useMemo(
    () => ({ chosen, has: (id: string) => chosen.has(id), toggle, toggleAll, clear }),
    [chosen, toggle, toggleAll, clear],
  );
}

/**
 * The bar that appears once rows are ticked: how many, the actions for them, and a way to clear the
 * ticks. It sits where the list starts, so the actions are in reach without scrolling.
 */
export function SelectionBar({
  selection,
  noun,
  children,
}: {
  selection: RowSelection;
  /** What a row is, for the count: "gift" gives "2 gifts chosen". */
  noun: string;
  /** The actions for the ticked rows, as buttons. */
  children: ReactNode;
}): ReactElement | null {
  const count = selection.chosen.size;
  if (count === 0) {
    return null;
  }
  return (
    // A labelled section is a region: the bar's name, for screen readers and tests alike.
    <section
      aria-label='Chosen'
      className='flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none'
    >
      <span role='status' className='mr-auto font-medium'>
        {`${String(count)} ${noun}${count === 1 ? '' : 's'} chosen`}
      </span>
      {children}
      <Button type='button' size='sm' variant='ghost' onClick={selection.clear}>
        Clear
      </Button>
    </section>
  );
}
