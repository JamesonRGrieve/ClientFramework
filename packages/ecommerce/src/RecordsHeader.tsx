// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { STORE_PATH } from './routes';

/** A store records page's heading, under a link back to the stores. */
export function RecordsHeader({ title }: { title: string }): ReactElement {
  return (
    <div className='grid gap-1'>
      <Link href={STORE_PATH} className='text-sm text-muted-foreground underline'>
        Stores
      </Link>
      <h1 className='text-3xl font-semibold'>{title}</h1>
    </div>
  );
}
