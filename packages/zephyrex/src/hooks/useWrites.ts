// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useMemo, useState } from 'react';
import { writeProblem } from '../lib/zephyrex/useGuardedSave';
import { deferWithUndo, notify } from './useToast';

/** What a component that writes needs: whether a write is under way, why the last one failed, and the two ways to write. */
export interface Writes {
  busy: boolean;
  /**
   * Why the last write failed, in words to show beside the control (`role='alert'`), or null. It
   * names the action and then the server's reason ("The gift could not be deleted: Someone else
   * changed it"), or just the action when the server gave none.
   */
  problem: string | null;
  /**
   * Runs `write`, then refreshes. Resolves true when it worked. A failure sets `problem` to
   * `fallback` and the server's reason; a success shows `done` as a notice, when given.
   */
  run: (write: Promise<unknown>, fallback: string, done?: string) => Promise<boolean>;
  /**
   * Removes something behind an Undo notice: `hide` at once, `write` once the notice has gone, and
   * `show` again if Undo is pressed or the write fails (with the reason in `problem` and a notice).
   */
  remove: (removal: Removal) => void;
}

export interface Removal {
  /** The notice: what was removed ("Peonies deleted"). */
  message: string;
  write: () => Promise<unknown>;
  fallback: string;
  hide: () => void;
  show: () => void;
}

/**
 * The write wrapper every list and form shares, so each one says why a write failed, says when it
 * worked, and lets a removal be taken back, the same way. `onChanged` refreshes what the write changed.
 */
/** A list with some of its items hidden while their removal can still be undone. */
export interface Hidden<T> {
  /** The items still shown: everything not hidden. */
  shown: T[];
  /**
   * Whether a hidden item is still in the list: its removal can still be undone, or hasn't reloaded
   * yet. Show a first-run ("nothing yet") state only when nothing is shown and nothing is pending, so
   * deleting the last item doesn't flash it while Undo is still on offer.
   */
  pending: boolean;
  hide: (ids: readonly string[]) => void;
  show: (ids: readonly string[]) => void;
}

/**
 * Which items of a list are hidden, by id. An id the list no longer contains (its removal went
 * through and the list reloaded) simply stops mattering, so nothing has to clear it. The list is
 * empty, for a first-run state, when `shown.length === 0 && !pending`. `shown` keeps its identity
 * until `items`, the hidden ids or `idOf` change, so it can key a `useMemo` or an effect. Pass a
 * stable `idOf` (a module-level function, or one from `useCallback`), not an inline arrow.
 */
export function useHidden<T>(items: readonly T[], idOf: (item: T) => string): Hidden<T> {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const shown = useMemo(() => items.filter((item) => !hidden.has(idOf(item))), [items, hidden, idOf]);
  const pending = useMemo(() => items.some((item) => hidden.has(idOf(item))), [items, hidden, idOf]);
  const change = (ids: readonly string[], hiding: boolean): void => {
    setHidden((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (hiding) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  };
  return {
    shown,
    pending,
    hide: (ids) => change(ids, true),
    show: (ids) => change(ids, false),
  };
}

/** "The gift could not be deleted." and "Gone already" make "The gift could not be deleted: Gone already". */
function described(fallback: string, reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  return reason === fallback ? fallback : `${fallback.replace(/\.$/, '')}: ${reason}`;
}

export function useWrites(onChanged: () => Promise<unknown>): Writes {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const run = async (write: Promise<unknown>, fallback: string, done?: string): Promise<boolean> => {
    setBusy(true);
    const failed = await writeProblem(write, fallback);
    setProblem(described(fallback, failed));
    if (failed === null && done !== undefined) {
      notify(done);
    }
    await onChanged();
    setBusy(false);
    return failed === null;
  };
  const remove = ({ message, write, fallback, hide, show }: Removal): void => {
    hide();
    deferWithUndo(
      message,
      () => {
        void (async (): Promise<void> => {
          if (!(await run(write(), fallback))) {
            show();
            notify(fallback);
          }
        })();
      },
      show,
    );
  };
  return { busy, problem, run, remove };
}
