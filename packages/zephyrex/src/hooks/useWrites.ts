// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useState } from 'react';
import { writeProblem } from '../lib/zephyrex/useGuardedSave';
import { deferWithUndo, notify } from './useToast';

/** What a component that writes needs: whether a write is under way, why the last one failed, and the two ways to write. */
export interface Writes {
  busy: boolean;
  /** Why the last write failed, in words to show beside the control (`role='alert'`), or null. */
  problem: string | null;
  /**
   * Runs `write`, then refreshes. Resolves true when it worked. A failure sets `problem` from the
   * server's message, or `fallback` when it gave none; a success shows `done` as a notice, when given.
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
export function useWrites(onChanged: () => Promise<unknown>): Writes {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const run = async (write: Promise<unknown>, fallback: string, done?: string): Promise<boolean> => {
    setBusy(true);
    const failed = await writeProblem(write, fallback);
    setProblem(failed);
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
