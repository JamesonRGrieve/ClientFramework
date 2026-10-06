// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { type ReactElement, useId, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { type DocType, useDocTypes } from './erpApi';
import { docTypePath } from './routes';

/** One instance's DocTypes, as the catalogue names its instance. */
interface Instance {
  reference: string;
  title: string;
  docTypes: DocType[];
}

/** `docTypes` grouped by the instance they belong to, in order. */
export function byInstance(docTypes: readonly DocType[]): Instance[] {
  const instances = new Map<string, Instance>();
  for (const docType of docTypes) {
    const instance = instances.get(docType.source_reference) ?? {
      reference: docType.source_reference,
      title: docType.source,
      docTypes: [],
    };
    instance.docTypes.push(docType);
    instances.set(docType.source_reference, instance);
  }
  return [...instances.values()];
}

/** The ERPNext DocTypes the user may use, by instance, with a filter by name. */
export function ErpPage(): ReactElement {
  const id = useId();
  const { data: docTypes = [], error, isLoading } = useDocTypes();
  const [filter, setFilter] = useState('');
  const wanted = filter.trim().toLowerCase();
  const shown = docTypes.filter(({ name }) => wanted === '' || name.toLowerCase().includes(wanted));

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>ERP</CardTitle>
          <CardDescription>
            The documents of your organisation’s ERPNext sites, read and saved live under their rules.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <div className='grid gap-1'>
            <Label htmlFor={id}>Find a document type</Label>
            <Input id={id} value={filter} onChange={(event) => setFilter(event.target.value)} />
          </div>
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The document types could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && shown.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              {isLoading
                ? 'Loading…'
                : docTypes.length === 0
                  ? 'No ERPNext site is connected for you.'
                  : 'No document type matches.'}
            </p>
          )}
          {byInstance(shown).map((instance) => (
            <section key={instance.reference} aria-label={instance.title} className='grid gap-2'>
              <h2 className='text-lg font-semibold'>{instance.title}</h2>
              <ul className='grid gap-1 text-sm sm:grid-cols-2 md:grid-cols-3'>
                {instance.docTypes.map((docType) => (
                  <li key={docType.slug}>
                    <Link href={docTypePath(docType)} className='hover:underline'>
                      {docType.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
