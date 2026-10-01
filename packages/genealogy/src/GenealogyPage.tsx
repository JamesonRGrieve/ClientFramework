// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { ReactElement } from 'react';
import { GedcomTransfer } from './GedcomTransfer';
import { KinshipLookup } from './KinshipLookup';
import { PeopleList } from './PeopleList';

/** The genealogy overview: everyone in the tree, how two of them are related, and GEDCOM transfer. */
export function GenealogyPage(): ReactElement {
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <h1 className='text-3xl font-semibold'>Family tree</h1>
      <PeopleList />
      <KinshipLookup />
      <GedcomTransfer />
    </main>
  );
}
