// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useState } from 'react';
import { ConflictPanel, serverInstant, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { createRecord, useRecordActions, useRecords } from './healthApi';
import { RecordForm, draftProblem } from './RecordForm';
import { changesFrom, conflictFields, type HealthRow, type RecordType } from './records';

type Notice = { text: string; alert: boolean } | null;

function NoticeLine({ notice }: { notice: Notice }): ReactElement | null {
  return notice === null ? null : (
    <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
      {notice.text}
    </p>
  );
}

/** Change one record, saved over the row it was opened on; or delete it. */
function RecordEditor<T extends HealthRow>({
  type,
  row,
  onClose,
}: {
  type: RecordType<T>;
  row: T;
  onClose: () => void;
}): ReactElement {
  const { update, remove } = useRecordActions(type);
  const { base, rebaseOnSave } = useEditBase(row);
  const [draft, setDraft] = useDraft(base, type.draftOf);
  const [notice, setNotice] = useState<Notice>(null);
  const failure = `The ${type.title.toLowerCase()} could not be saved.`;

  const settleSave = async (saving: Promise<boolean>): Promise<void> => {
    try {
      setNotice((await rebaseOnSave(saving)) ? { text: 'Saved.', alert: false } : null);
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : failure, alert: true });
    }
  };
  const settleRemove = async (removing: Promise<boolean>): Promise<void> => {
    const problem = await writeProblem(
      (async (): Promise<void> => {
        if (await removing) {
          onClose();
        }
      })(),
      `The ${type.title.toLowerCase()} could not be deleted.`,
    );
    setNotice(problem === null ? null : { text: problem, alert: true });
  };

  const submit = (): void => {
    const problem = draftProblem(type, draft);
    if (problem !== null) {
      setNotice({ text: problem, alert: true });
      return;
    }
    const changes = changesFrom(type, base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  return (
    <section aria-label={`Edit ${type.title.toLowerCase()}`} className='grid gap-3 rounded-md border p-4'>
      <RecordForm
        type={type}
        draft={draft}
        label={`Edit ${type.title.toLowerCase()}`}
        onEdit={(key, value) => {
          setDraft((current) => ({ ...current, [key]: value }));
          setNotice(null);
        }}
        onSubmit={submit}
      >
        <Button type='submit'>Save</Button>
        <Button type='button' variant='ghost' onClick={onClose}>
          Close
        </Button>
        <Button
          type='button'
          variant='outline'
          className='ml-auto'
          onClick={() => {
            void settleRemove(remove.save(base, {}));
          }}
        >
          Delete
        </Button>
      </RecordForm>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={conflictFields(type)}
          onResolve={(merged) => {
            void settleSave(update.resolve(merged));
          }}
          onDiscard={update.discard}
        />
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Delete anyway'
          onResolve={(merged) => {
            void settleRemove(remove.resolve(merged));
          }}
          onDiscard={remove.discard}
        />
      )}
      <NoticeLine notice={notice} />
    </section>
  );
}

/** Record a new `type` entry, starting from now. */
function NewRecordForm<T extends HealthRow>({ type }: { type: RecordType<T> }): ReactElement {
  const client = useClient();
  const { mutate: refresh } = useRecords(type);
  const [draft, setDraft] = useState(() => type.draftOf(null));
  const [notice, setNotice] = useState<Notice>(null);

  const submit = (): void => {
    const problem = draftProblem(type, draft);
    if (problem !== null) {
      setNotice({ text: problem, alert: true });
      return;
    }
    const adding = (async (): Promise<void> => {
      await createRecord(client, type, changesFrom(type, null, draft));
      await refresh();
      setDraft(type.draftOf(null));
    })();
    void (async (): Promise<void> => {
      const failed = await writeProblem(adding, `The ${type.title.toLowerCase()} could not be recorded.`);
      setNotice(failed === null ? { text: 'Recorded.', alert: false } : { text: failed, alert: true });
    })();
  };

  return (
    <section aria-label={`New ${type.title.toLowerCase()}`} className='grid gap-3'>
      <RecordForm
        type={type}
        draft={draft}
        label={`New ${type.title.toLowerCase()}`}
        onEdit={(key, value) => {
          setDraft((current) => ({ ...current, [key]: value }));
          setNotice(null);
        }}
        onSubmit={submit}
      >
        <Button type='submit'>Record {type.title.toLowerCase()}</Button>
      </RecordForm>
      <NoticeLine notice={notice} />
    </section>
  );
}

/** A `type` log: its records newest first, one at a time open to edit, and a form to record another. */
export function RecordsPanel<T extends HealthRow>({ type }: { type: RecordType<T> }): ReactElement {
  const records = useRecords(type);
  const [openId, setOpenId] = useState<string | null>(null);
  const all = records.data ?? [];
  const open = all.find((row) => row.id === openId);

  return (
    <div className='grid gap-6'>
      <NewRecordForm type={type} />
      {records.error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The {type.plural.toLowerCase()} could not be loaded: {records.error.message}
        </p>
      )}
      {records.error === undefined && all.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          {records.isLoading ? 'Loading…' : `No ${type.plural.toLowerCase()} recorded yet.`}
        </p>
      )}
      {all.length > 0 && (
        <ul aria-label={type.plural} className='divide-y rounded-md border'>
          {all.map((row) => (
            <li key={row.id} className='flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm'>
              <button
                type='button'
                className='text-left font-medium hover:underline'
                aria-expanded={row.id === openId}
                onClick={() => setOpenId(row.id === openId ? null : row.id)}
              >
                {type.describe(row)}
              </button>
              <span className='text-muted-foreground'>{serverInstant(type.timeOf(row)).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
      {open !== undefined && <RecordEditor key={open.id} type={type} row={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
