// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type Dispatch, type SetStateAction, useState } from 'react';

/**
 * A form's values, filled from `base` (the row an edit is based on) and refilled whenever the base
 * moves, which happens once the user's save lands: the form then shows the row as saved, merges
 * included.
 */
export function useDraft<T, D>(base: T, draftOf: (row: T) => D): [D, Dispatch<SetStateAction<D>>] {
  const [draft, setDraft] = useState(() => draftOf(base));
  const [filledFrom, setFilledFrom] = useState(base);
  if (filledFrom !== base) {
    setFilledFrom(base);
    setDraft(draftOf(base));
  }
  return [draft, setDraft];
}
