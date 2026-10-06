// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useMemo, useState } from 'react';
import { shownTime, useClient } from 'zephyrex';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { DocumentFields } from './DocumentFields';
import { DocTypeGate } from './DocTypeGate';
import { createDocument, type DocType, PAGE_LENGTH, useDocuments } from './erpApi';
import { documentPath } from './routes';
import { fieldsOf, type FormValues, formProblem, formValuesOf, writePayload } from './schemaFields';
import { statusLabel } from './status';

/** Fill in a new document's fields and create it, then open it. */
function NewDocument({ docType }: { docType: DocType }): ReactElement {
  const client = useClient();
  const router = useRouter();
  const fields = useMemo(() => (docType.write_schema === null ? [] : fieldsOf(docType.write_schema)), [docType]);
  const empty = useMemo(() => formValuesOf(fields, {}), [fields]);
  const [values, setValues] = useState<FormValues>(empty);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = formProblem(fields, values);
    if (wrong !== null) {
      setProblem(wrong);
      return;
    }
    setPending(true);
    setProblem(null);
    void (async (): Promise<void> => {
      try {
        const created = await createDocument(client, docType, writePayload(fields, values, empty));
        router.push(documentPath(docType, created.name));
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'The document could not be created.');
        setPending(false);
      }
    })();
  };

  return (
    <form aria-label={`New ${docType.name}`} className='grid gap-3' noValidate onSubmit={submit}>
      <DocumentFields fields={fields} values={values} onChange={setValues} />
      <div>
        <Button type='submit' disabled={pending}>
          Create {docType.name}
        </Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** A page of `docType`'s documents, newest first, with the previous and next pages. */
function DocumentList({ docType }: { docType: DocType }): ReactElement {
  const [start, setStart] = useState(0);
  const { data: page, error, isLoading } = useDocuments(docType, start);
  const items = page?.items ?? [];

  if (error !== undefined) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        The documents could not be loaded: {error.message}
      </p>
    );
  }
  return (
    <div className='grid gap-3'>
      {items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {isLoading ? 'Loading…' : start === 0 ? 'There are none yet.' : 'There are no more.'}
        </p>
      ) : (
        <ul aria-label={`${docType.name} documents`} className='divide-y rounded-md border'>
          {items.map((document) => (
            <li key={document.name} className='flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm'>
              <Link href={documentPath(docType, document.name)} className='font-medium hover:underline'>
                {document.name}
              </Link>
              <span className='text-muted-foreground'>
                {[statusLabel(document.docstatus), shownTime(document.updated_at)].filter((part) => part !== '').join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className='flex gap-2'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={start === 0}
          onClick={() => setStart(Math.max(0, start - PAGE_LENGTH))}
        >
          Newer
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={items.length < PAGE_LENGTH}
          onClick={() => setStart(start + PAGE_LENGTH)}
        >
          Older
        </Button>
      </div>
    </div>
  );
}

/** One DocType: its documents, and making one. */
export function DocTypePage({ params }: { params: Record<string, string> }): ReactElement {
  const [creating, setCreating] = useState(false);
  return (
    <DocTypeGate params={params}>
      {(docType) => (
        <>
          {docType.operations.includes('list') && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList docType={docType} />
              </CardContent>
            </Card>
          )}
          {docType.operations.includes('create') && docType.write_schema !== null && (
            <Card>
              <CardHeader>
                <CardTitle>New {docType.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {creating ? (
                  <NewDocument docType={docType} />
                ) : (
                  <Button type='button' variant='outline' onClick={() => setCreating(true)}>
                    Make a new {docType.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {!docType.operations.includes('list') && (
            <p className='text-sm'>
              {docType.name} has one document:{' '}
              <Link href={documentPath(docType, docType.name)} className='underline'>
                open it
              </Link>
              .
            </p>
          )}
        </>
      )}
    </DocTypeGate>
  );
}
