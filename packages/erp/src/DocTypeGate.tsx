// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement, ReactNode } from 'react';
import { type DocType, useDocTypes } from './erpApi';
import { ERP_PATH } from './routes';

/**
 * The DocType a page's `namespace` and `slug` name, with its heading, once the catalogue has it;
 * otherwise why not. `children` renders the page for it.
 */
export function DocTypeGate({
  params,
  children,
}: {
  params: Record<string, string>;
  children: (docType: DocType) => ReactNode;
}): ReactElement {
  const { data: docTypes, error, isLoading } = useDocTypes();
  const docType = docTypes?.find(({ namespace, slug }) => namespace === params['namespace'] && slug === params['slug']);

  if (error !== undefined) {
    return (
      <p role='alert' className='p-4 text-sm text-destructive'>
        The document types could not be loaded: {error.message}
      </p>
    );
  }
  if (docType === undefined) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'This document type is not one you can use.'}{' '}
        <Link href={ERP_PATH} className='underline'>
          Back to the document types
        </Link>
      </p>
    );
  }
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={ERP_PATH} className='text-sm text-muted-foreground underline'>
          {docType.source}
        </Link>
        <h1 className='text-3xl font-semibold'>{docType.name}</h1>
      </div>
      {children(docType)}
    </main>
  );
}
