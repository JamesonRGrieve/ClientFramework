// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useState } from 'react';
import type { z } from 'zod';
import { etagOf, StaleWriteError, type Versioned } from './client';

/** A write the server refused because the row changed after the user read it. */
export interface Conflict<T> {
  /** The user's changes, exactly as they made them. */
  readonly mine: Partial<T>;
  /** The row as the server has it now; null when the server didn't send it (it may be gone). */
  readonly theirs: T | null;
}

export interface GuardedSave<T> {
  /** Writes `changes` to `seen`: true once written, false when refused as stale (see `conflict`). */
  save: (seen: T, changes: Partial<T>) => Promise<boolean>;
  /** The refused write, until it is resolved or discarded. */
  conflict: Conflict<T> | null;
  /** Writes `merged` over the row as it is now, guarded by its new version. */
  resolve: (merged: Partial<T>) => Promise<boolean>;
  /** Drops the user's refused changes. Only ever by their explicit choice. */
  discard: () => void;
}

export interface EditBase<T> {
  /** The row as it was when the user began editing: what an edit is diffed against and guarded by. */
  base: T;
  /** Passes a save's outcome through, moving the base to the live row once the save has landed. */
  rebaseOnSave: (saving: Promise<boolean>) => Promise<boolean>;
}

/**
 * The row an edit is based on. Pages re-read rows on their own (SWR revalidates on focus), so the
 * live row can move while a form is open; guarding the save by the live version would let a stale
 * edit overwrite what someone else changed. The base stays the row the user started from, so a
 * save made over a newer row is refused (and shown as a conflict), and moves to the live row only
 * once a save made through `rebaseOnSave` has landed.
 */
export function useEditBase<T extends Versioned>(live: T): EditBase<T> {
  const [base, setBase] = useState(live);
  const [following, setFollowing] = useState(false);
  if (following && etagOf(live) !== etagOf(base)) {
    setBase(live);
    setFollowing(false);
  }
  const rebaseOnSave = useCallback(async (saving: Promise<boolean>): Promise<boolean> => {
    const saved = await saving;
    if (saved) {
      setFollowing(true);
    }
    return saved;
  }, []);
  return { base, rebaseOnSave };
}

/**
 * What to tell the user about `writing`: null once it is done, else why it failed (the error's
 * message, which the client makes the server's reason, or `fallback`).
 */
export async function writeProblem(writing: Promise<unknown>, fallback: string): Promise<string | null> {
  try {
    await writing;
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : fallback;
  }
}

/**
 * Runs `write`, a change guarded by the row it was made against (the client sends that row's
 * version as If-Match). When the row changed underneath, the user's changes are kept, never
 * dropped, and the conflict holds them beside the row as it is now, read with `schema`, until the
 * user resolves it, which writes against the current version, or discards it. `write` updates what
 * the page shows from the server's answer, so the next write is guarded by the new version.
 */
export function useGuardedSave<T extends Versioned>(
  write: (seen: T, changes: Partial<T>) => Promise<unknown>,
  schema: z.ZodType<T>,
): GuardedSave<T> {
  const [conflict, setConflict] = useState<Conflict<T> | null>(null);

  const save = useCallback(
    async (seen: T, changes: Partial<T>): Promise<boolean> => {
      try {
        await write(seen, changes);
        setConflict(null);
        return true;
      } catch (error) {
        if (!(error instanceof StaleWriteError)) {
          throw error;
        }
        setConflict({ mine: changes, theirs: error.current === null ? null : schema.parse(error.current) });
        return false;
      }
    },
    [write, schema],
  );

  const resolve = useCallback(
    async (merged: Partial<T>): Promise<boolean> => {
      const current = conflict?.theirs ?? null;
      if (current === null) {
        throw new Error('There is no current row to write against: discard the changes and reload.');
      }
      return save(current, merged);
    },
    [conflict, save],
  );

  const discard = useCallback(() => {
    setConflict(null);
  }, []);

  return { save, conflict, resolve, discard };
}
