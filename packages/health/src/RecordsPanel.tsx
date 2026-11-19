// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { LoadProblem } from 'zephyrex/ui/load-problem';
import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, type ReactNode, useState } from 'react';
import { ConflictPanel, serverInstant, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
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

/** How a record's time shows in the list: short, with the full instant on hover. */
const WHEN: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
};

/** Change one record, saved over the row it was opened on; or delete it. */
function RecordEditor<T extends HealthRow>({
  type,
  row,
  onClose,
  suggestions,
}: {
  type: RecordType<T>;
  row: T;
  onClose: () => void;
  suggestions?: Readonly<Record<string, readonly string[]>> | undefined;
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
        suggestions={suggestions}
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
function NewRecordForm<T extends HealthRow>({
  type,
  suggestions,
  stacked = false,
}: {
  type: RecordType<T>;
  suggestions?: Readonly<Record<string, readonly string[]>> | undefined;
  stacked?: boolean;
}): ReactElement {
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
        suggestions={suggestions}
        stacked={stacked}
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
export function RecordsPanel<T extends HealthRow>({
  type,
  suggestions,
  layout = 'stack',
  lead,
}: {
  type: RecordType<T>;
  /** Per field key, values a text field offers one tap each (e.g. the people in your tree). */
  suggestions?: Readonly<Record<string, readonly string[]>> | undefined;
  /** `split`: on a wide screen the form and the history sit side by side, the history headed. */
  layout?: 'stack' | 'split';
  /** Something shown before each record in the history, such as a mood marker. */
  lead?: (row: T) => ReactNode;
}): ReactElement {
  const records = useRecords(type);
  const [openId, setOpenId] = useState<string | null>(null);
  const all = records.data ?? [];
  const open = all.find((row) => row.id === openId);

  return (
    <div className={layout === 'split' ? 'grid items-start gap-6 lg:grid-cols-2 lg:gap-10' : 'grid gap-6'}>
      <NewRecordForm type={type} suggestions={suggestions} stacked={layout === 'split'} />
      <div className='grid content-start gap-4'>
        {layout === 'split' && (
          <h2 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
            History{all.length > 0 && <span className='ml-2 font-normal tabular-nums'>{String(all.length)}</span>}
          </h2>
        )}
        {records.error !== undefined && (
          <LoadProblem
            what={`the ${type.plural.toLowerCase()}`}
            error={records.error}
            onRetry={async () => records.mutate()}
          />
        )}
        {records.error === undefined && all.length === 0 && records.isLoading && (
          <SkeletonRows rows={2} label={`Loading ${type.plural.toLowerCase()}`} />
        )}
        {records.error === undefined && all.length === 0 && !records.isLoading && (
          <p className='text-sm text-muted-foreground'>No {type.plural.toLowerCase()} recorded yet.</p>
        )}
        {all.length > 0 && (
          <ul aria-label={type.plural} className='divide-y rounded-md border'>
            {all.map((row) => (
              <li key={row.id} className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm'>
                {lead?.(row)}
                <button
                  type='button'
                  className='flex-1 text-left font-medium hover:underline'
                  aria-expanded={row.id === openId}
                  onClick={() => setOpenId(row.id === openId ? null : row.id)}
                >
                  {type.describe(row)}
                </button>
                <time
                  dateTime={serverInstant(type.timeOf(row)).toISOString()}
                  title={serverInstant(type.timeOf(row)).toLocaleString()}
                  className='tabular-nums text-muted-foreground'
                >
                  {serverInstant(type.timeOf(row)).toLocaleString(undefined, WHEN)}
                </time>
              </li>
            ))}
          </ul>
        )}
        {open !== undefined && (
          <RecordEditor key={open.id} type={type} row={open} onClose={() => setOpenId(null)} suggestions={suggestions} />
        )}
      </div>
    </div>
  );
}
