// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactElement } from 'react';

/** What went wrong, announced to assistive technology; nothing when nothing did. */
export function Problem({ text }: { text: string | null }): ReactElement | null {
  return text === null ? null : (
    <p role='alert' className='text-sm text-destructive'>
      {text}
    </p>
  );
}
