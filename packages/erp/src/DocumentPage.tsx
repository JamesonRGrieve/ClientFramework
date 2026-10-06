// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useMemo, useState } from 'react';
import { type ConflictField, ConflictPanel, type GuardedSave, shownTime, useDraft, useEditBase } from 'zephyrex';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { DocumentFields } from './DocumentFields';
import { DocTypeGate } from './DocTypeGate';
import { type DocType, type ErpDocument, useDocument, useDocumentActions } from './erpApi';
import { docTypePath } from './routes';
import { type FieldSpec, fieldsOf, formProblem, formValuesOf, writePayload } from './schemaFields';
import { isDraft, isSubmitted, statusLabel } from './status';

const SAVE_FAILURE = 'The document could not be saved.';

type Notice = { text: string; alert: boolean } | null;

/** One action on the document (delete, submit, cancel) with its conflict panel. */
function ActionConflict({
  action,
  applyLabel,
  onSettled,
}: {
  action: GuardedSave<ErpDocument>;
  applyLabel: string;
  onSettled: (resolving: Promise<boolean>) => void;
}): ReactElement | null {
  return action.conflict === null ? null : (
    <ConflictPanel
      conflict={action.conflict}
      fields={[]}
      applyLabel={applyLabel}
      onResolve={(merged) => onSettled(action.resolve(merged))}
      onDiscard={action.discard}
    />
  );
}

/** A document's fields, saved over it as loaded; deleting it; submitting a draft or cancelling it once submitted. */
function DocumentEditor({ docType, document }: { docType: DocType; document: ErpDocument }): ReactElement {
  const router = useRouter();
  const fields = useMemo(() => (docType.write_schema === null ? [] : fieldsOf(docType.write_schema)), [docType]);
  const draftOf = useMemo(() => (row: ErpDocument) => formValuesOf(fields, row), [fields]);
  const { save, remove, submit, cancel } = useDocumentActions(docType, document.name);
  const { base, rebaseOnSave } = useEditBase(document);
  const [values, setValues] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<Notice>(null);
  const conflictFields: ConflictField<ErpDocument>[] = fields
    .filter(({ kind }) => kind !== 'table')
    .map(({ name, label }: FieldSpec) => ({ key: name, label }));

  const settle = async (writing: Promise<boolean>, done: string): Promise<void> => {
    try {
      setNotice((await rebaseOnSave(writing)) ? { text: done, alert: false } : null);
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : SAVE_FAILURE, alert: true });
    }
  };
  const settleRemove = async (removing: Promise<boolean>): Promise<void> => {
    try {
      if (await removing) {
        router.push(docTypePath(docType));
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'The document could not be deleted.', alert: true });
    }
  };

  const submitForm = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = formProblem(fields, values);
    if (wrong !== null) {
      setNotice({ text: wrong, alert: true });
      return;
    }
    const changes = writePayload(fields, values, draftOf(base));
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settle(save.save(base, changes), 'Saved.');
  };

  const editable = docType.operations.includes('update') && isDraft(base.docstatus ?? 0) && fields.length > 0;
  return (
    <div className='grid gap-3'>
      <p className='text-sm text-muted-foreground'>
        {[statusLabel(base.docstatus), shownTime(base.updated_at)].filter((part) => part !== '').join(' · ')}
      </p>
      <form aria-label={`${docType.name} ${document.name}`} className='grid gap-3' noValidate onSubmit={submitForm}>
        <fieldset disabled={!editable} className='grid gap-3'>
          <legend className='sr-only'>Its fields</legend>
          <DocumentFields fields={fields} values={values} onChange={setValues} />
        </fieldset>
        <div className='flex flex-wrap gap-2'>
          {editable && <Button type='submit'>Save</Button>}
          {isDraft(base.docstatus) && (
            <Button type='button' variant='outline' onClick={() => void settle(submit.save(base, {}), 'Submitted.')}>
              Submit
            </Button>
          )}
          {isSubmitted(base.docstatus) && (
            <Button type='button' variant='outline' onClick={() => void settle(cancel.save(base, {}), 'Cancelled.')}>
              Cancel it
            </Button>
          )}
          {docType.operations.includes('delete') && (
            <Button
              type='button'
              variant='ghost'
              className='ml-auto'
              onClick={() => void settleRemove(remove.save(base, {}))}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
      {save.conflict !== null && (
        <ConflictPanel
          conflict={save.conflict}
          fields={conflictFields}
          onResolve={(merged) => {
            void settle(save.resolve(merged), 'Saved.');
          }}
          onDiscard={save.discard}
        />
      )}
      <ActionConflict
        action={submit}
        applyLabel='Submit anyway'
        onSettled={(resolving) => void settle(resolving, 'Submitted.')}
      />
      <ActionConflict
        action={cancel}
        applyLabel='Cancel it anyway'
        onSettled={(resolving) => void settle(resolving, 'Cancelled.')}
      />
      <ActionConflict action={remove} applyLabel='Delete anyway' onSettled={(resolving) => void settleRemove(resolving)} />
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
          {notice.text}
        </p>
      )}
    </div>
  );
}

/** The document, once loaded. */
function DocumentCard({ docType, name }: { docType: DocType; name: string }): ReactElement {
  const { data: document, error, isLoading } = useDocument(docType, name);
  if (error !== undefined) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        The document could not be loaded: {error.message}
      </p>
    );
  }
  if (document === undefined || document === null) {
    return (
      <p className='text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'There is no such document.'}{' '}
        <Link href={docTypePath(docType)} className='underline'>
          Back to the {docType.name} documents
        </Link>
      </p>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{document.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentEditor key={document.name} docType={docType} document={document} />
      </CardContent>
    </Card>
  );
}

/** One document of a DocType. */
export function DocumentPage({ params }: { params: Record<string, string> }): ReactElement {
  return (
    <DocTypeGate params={params}>{(docType) => <DocumentCard docType={docType} name={params['name'] ?? ''} />}</DocTypeGate>
  );
}
