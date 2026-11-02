// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useClient, useUser, writeProblem } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { agreementsApi, useAgreements } from './agreementsApi';
import {
  type Agreement,
  type AgreementPerson,
  dueForRevisit,
  KINDS,
  kindChoice,
  kindLabel,
  type Term,
  type TermKind,
} from './agreementsModel';

const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
const NOBODY = '';

type NameOf = (userId: string) => string;

function Problem({ problem }: { problem: string | null }): ReactNode {
  return problem === null ? null : (
    <p role='alert' className='text-sm text-destructive'>
      {problem}
    </p>
  );
}

/** A date (YYYY-MM-DD) the way people write it: "1 January 2027". */
function longDate(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

const today = (): string => new Date().toLocaleDateString('en-CA');

/** Names in a sentence: "Alex", "Alex and Sam", "Alex, Sam and Jordan". */
export function listed(names: readonly string[]): string {
  if (names.length <= 1) {
    return names.join('');
  }
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;
}

/** Runs a write, then shows its problem (or nothing) and refreshes the agreements. */
function useWrite(onChanged: () => Promise<unknown>): {
  busy: boolean;
  problem: string | null;
  run: (write: Promise<unknown>, fallback: string) => Promise<boolean>;
} {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const run = async (write: Promise<unknown>, fallback: string): Promise<boolean> => {
    setBusy(true);
    const failed = await writeProblem(write, fallback);
    setProblem(failed);
    await onChanged();
    setBusy(false);
    return failed === null;
  };
  return { busy, problem, run };
}

function StartAgreement({
  people,
  onStarted,
}: {
  people: readonly AgreementPerson[];
  onStarted: () => Promise<unknown>;
}): ReactNode {
  const client = useClient();
  const ids = { title: useId(), revisit: useId() };
  const [title, setTitle] = useState('');
  const [revisit, setRevisit] = useState('');
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const { busy, problem, run } = useWrite(onStarted);
  const toggle = (userId: string): void =>
    setChosen((current) => (current.includes(userId) ? current.filter((u) => u !== userId) : [...current, userId]));
  const start = (event: SyntheticEvent): void => {
    event.preventDefault();
    void (async (): Promise<void> => {
      const started = await run(
        agreementsApi.start(client, {
          title: title.trim(),
          revisit_on: revisit === '' ? null : revisit,
          party_user_ids: [...chosen],
        }),
        'The agreement could not be started.',
      );
      if (started) {
        setTitle('');
        setRevisit('');
        setChosen([]);
      }
    })();
  };
  return (
    <form onSubmit={start} aria-label='Start an agreement' className='grid gap-3'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <label htmlFor={ids.title} className='grid gap-1 text-sm font-medium'>
          What to call it
          <Input
            id={ids.title}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder='Us'
            maxLength={200}
            required
          />
        </label>
        <label htmlFor={ids.revisit} className='grid gap-1 text-sm font-medium'>
          Revisit by (optional)
          <Input id={ids.revisit} type='date' value={revisit} onChange={(event) => setRevisit(event.target.value)} />
        </label>
      </div>
      <fieldset className='grid gap-2'>
        <legend className='text-sm font-medium'>With</legend>
        {people.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Nobody with an account yet. You can start it on your own and add people later.
          </p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {people.map((person) => (
              <label
                key={person.userId}
                className='flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10'
              >
                <input type='checkbox' checked={chosen.includes(person.userId)} onChange={() => toggle(person.userId)} />
                {person.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <Problem problem={problem} />
      <Button type='submit' className='justify-self-start' disabled={busy || title.trim() === ''}>
        Start the agreement
      </Button>
    </form>
  );
}

function TermRow({ term, nameOf, onChanged }: { term: Term; nameOf: NameOf; onChanged: () => Promise<unknown> }): ReactNode {
  const client = useClient();
  const ids = { kind: useId(), text: useId() };
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<TermKind>(term.kind);
  const [text, setText] = useState(term.text);
  const { busy, problem, run } = useWrite(onChanged);
  const save = (event: SyntheticEvent): void => {
    event.preventDefault();
    void (async (): Promise<void> => {
      if (await run(agreementsApi.changeTerm(client, term.id, { kind, text: text.trim() }), 'That could not be saved.')) {
        setEditing(false);
      }
    })();
  };
  if (editing) {
    return (
      <li className='py-2'>
        <form onSubmit={save} aria-label={`Change “${term.text}”`} className='grid gap-2 sm:grid-cols-[8rem_1fr_auto_auto]'>
          <label htmlFor={ids.kind} className='sr-only'>
            Kind
          </label>
          <select
            id={ids.kind}
            value={kind}
            onChange={(event) => setKind(KINDS.find((k) => k === event.target.value) ?? kind)}
            className={SELECT}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {kindChoice(k)}
              </option>
            ))}
          </select>
          <label htmlFor={ids.text} className='sr-only'>
            Wording
          </label>
          <Input id={ids.text} value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} required />
          <Button type='submit' size='sm' disabled={busy || text.trim() === ''}>
            Save
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              setEditing(false);
              setKind(term.kind);
              setText(term.text);
            }}
          >
            Cancel
          </Button>
        </form>
        <Problem problem={problem} />
      </li>
    );
  }
  return (
    <li className='grid gap-1 py-2'>
      <div className='flex flex-wrap items-start gap-2'>
        <span className='flex-1'>{term.text}</span>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={() => setEditing(true)}
          aria-label={`Change “${term.text}”`}
        >
          Change
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          disabled={busy}
          aria-label={`Take out “${term.text}”`}
          onClick={() => void run(agreementsApi.removeTerm(client, term.id), 'That could not be taken out.')}
        >
          Take out
        </Button>
      </div>
      <span className='text-xs text-muted-foreground'>Written by {nameOf(term.written_by)}</span>
      <Problem problem={problem} />
    </li>
  );
}

function AddTerm({ agreement, onChanged }: { agreement: Agreement; onChanged: () => Promise<unknown> }): ReactNode {
  const client = useClient();
  const ids = { kind: useId(), text: useId() };
  const [kind, setKind] = useState<TermKind>('agreement');
  const [text, setText] = useState('');
  const { busy, problem, run } = useWrite(onChanged);
  const add = (event: SyntheticEvent): void => {
    event.preventDefault();
    void (async (): Promise<void> => {
      if (await run(agreementsApi.addTerm(client, agreement.id, kind, text.trim()), 'That could not be added.')) {
        setText('');
      }
    })();
  };
  return (
    <form onSubmit={add} aria-label={`Add to ${agreement.title}`} className='grid gap-2'>
      <div className='grid gap-2 sm:grid-cols-[8rem_1fr_auto]'>
        <label htmlFor={ids.kind} className='sr-only'>
          Kind
        </label>
        <select
          id={ids.kind}
          value={kind}
          onChange={(event) => setKind(KINDS.find((k) => k === event.target.value) ?? kind)}
          className={SELECT}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {kindChoice(k)}
            </option>
          ))}
        </select>
        <label htmlFor={ids.text} className='sr-only'>
          New term
        </label>
        <Input
          id={ids.text}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Something agreed, a like or a limit'
          maxLength={2000}
        />
        <Button type='submit' variant='outline' disabled={busy || text.trim() === ''}>
          Add
        </Button>
      </div>
      <Problem problem={problem} />
    </form>
  );
}

function Details({
  agreement,
  isOwner,
  me,
  people,
  nameOf,
  onChanged,
}: {
  agreement: Agreement;
  isOwner: boolean;
  me: string;
  people: readonly AgreementPerson[];
  nameOf: NameOf;
  onChanged: () => Promise<unknown>;
}): ReactNode {
  const client = useClient();
  const ids = { revisit: useId(), add: useId() };
  const [revisit, setRevisit] = useState(agreement.revisit_on ?? '');
  const [adding, setAdding] = useState(NOBODY);
  const { busy, problem, run } = useWrite(onChanged);
  const inIt = new Set(agreement.parties.map((p) => p.user_id));
  const addable = people.filter((person) => !inIt.has(person.userId));
  return (
    <div className='grid gap-3 border-t pt-4'>
      <div className='flex flex-wrap items-end gap-2'>
        <label htmlFor={ids.revisit} className='grid gap-1 text-sm font-medium'>
          Revisit by
          <Input id={ids.revisit} type='date' value={revisit} onChange={(event) => setRevisit(event.target.value)} />
        </label>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={busy || revisit === (agreement.revisit_on ?? '')}
          onClick={() =>
            void run(
              agreementsApi.change(client, agreement.id, revisit === '' ? { clear_revisit: true } : { revisit_on: revisit }),
              'The date could not be saved.',
            )
          }
        >
          Save the date
        </Button>
      </div>
      {isOwner && addable.length > 0 && (
        <div className='flex flex-wrap items-end gap-2'>
          <label htmlFor={ids.add} className='grid gap-1 text-sm font-medium'>
            Add someone
            <select id={ids.add} value={adding} onChange={(event) => setAdding(event.target.value)} className={SELECT}>
              <option value={NOBODY}>Choose someone…</option>
              {addable.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={busy || adding === NOBODY}
            onClick={() =>
              void (async (): Promise<void> => {
                if (await run(agreementsApi.addParty(client, agreement.id, adding), 'They could not be added.')) {
                  setAdding(NOBODY);
                }
              })()
            }
          >
            Add them
          </Button>
        </div>
      )}
      <div className='flex flex-wrap gap-2'>
        {isOwner ? (
          <Button
            type='button'
            size='sm'
            variant='ghost'
            className='text-destructive'
            disabled={busy}
            onClick={() => void run(agreementsApi.remove(client, agreement.id), 'The agreement could not be deleted.')}
          >
            Delete it for everyone
          </Button>
        ) : (
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={busy}
            onClick={() => void run(agreementsApi.removeParty(client, agreement.id, me), 'You could not leave it just now.')}
          >
            Leave it
          </Button>
        )}
        {isOwner &&
          agreement.parties
            .filter((p) => p.user_id !== me)
            .map((p) => (
              <Button
                key={p.user_id}
                type='button'
                size='sm'
                variant='ghost'
                disabled={busy}
                onClick={() =>
                  void run(agreementsApi.removeParty(client, agreement.id, p.user_id), 'They could not be taken out.')
                }
              >
                Take {nameOf(p.user_id)} out
              </Button>
            ))}
      </div>
      <Problem problem={problem} />
    </div>
  );
}

function AgreementCard({
  agreement,
  me,
  people,
  nameOf,
  onChanged,
}: {
  agreement: Agreement;
  me: string;
  people: readonly AgreementPerson[];
  nameOf: NameOf;
  onChanged: () => Promise<unknown>;
}): ReactNode {
  const client = useClient();
  const [open, setOpen] = useState(false);
  const { busy, problem, run } = useWrite(onChanged);
  const mine = agreement.parties.find((p) => p.user_id === me);
  const waiting = agreement.parties.filter((p) => !p.confirmed).map((p) => nameOf(p.user_id));
  const due = dueForRevisit(agreement.revisit_on, today());
  const others = agreement.parties.filter((p) => p.user_id !== me).map((p) => nameOf(p.user_id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{agreement.title}</h2>
        </CardTitle>
        <CardDescription>{others.length === 0 ? 'Just you, so far.' : `With ${listed(others)}.`}</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <div role='status' aria-label={`Where ${agreement.title} stands`} className='grid gap-1 text-sm'>
          {agreement.in_effect ? (
            <span className='font-medium text-primary'>Everyone has confirmed this version.</span>
          ) : (
            <span className='font-medium'>Waiting for {listed(waiting)} to confirm.</span>
          )}
          {agreement.revisit_on !== null && agreement.revisit_on !== undefined && (
            <span className={due ? 'font-medium text-destructive' : 'text-muted-foreground'}>
              {due ? 'Time to revisit it' : 'Revisit by'} {longDate(agreement.revisit_on)}.
            </span>
          )}
        </div>
        {KINDS.map((kind) => {
          const terms = agreement.terms.filter((t) => t.kind === kind);
          return terms.length === 0 ? null : (
            <section key={kind} aria-label={`${agreement.title}: ${kindLabel(kind)}`} className='grid gap-1'>
              <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>{kindLabel(kind)}</h3>
              <ul className='divide-y'>
                {terms.map((term) => (
                  <TermRow
                    key={`${term.id}-${String(agreement.version)}`}
                    term={term}
                    nameOf={nameOf}
                    onChanged={onChanged}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {agreement.terms.length === 0 && <p className='text-sm text-muted-foreground'>Nothing written down yet.</p>}
        <AddTerm agreement={agreement} onChanged={onChanged} />
        <div className='flex flex-wrap items-center gap-3'>
          {mine?.confirmed === true ? (
            <span className='text-sm text-muted-foreground'>You confirmed this version.</span>
          ) : (
            <Button
              type='button'
              disabled={busy}
              onClick={() => void run(agreementsApi.confirm(client, agreement.id), 'Your confirmation could not be saved.')}
            >
              Confirm this version
            </Button>
          )}
          <Button type='button' variant='ghost' size='sm' aria-expanded={open} onClick={() => setOpen((was) => !was)}>
            {open ? 'Hide the details' : 'Date and people'}
          </Button>
        </div>
        <Problem problem={problem} />
        {open && (
          <Details
            agreement={agreement}
            isOwner={agreement.owner_id === me}
            me={me}
            people={people}
            nameOf={nameOf}
            onChanged={onChanged}
          />
        )}
      </CardContent>
    </Card>
  );
}

export interface AgreementsPageProps {
  /** The accounts the app knows, to choose who an agreement is with and name them. */
  people?: readonly AgreementPerson[];
  /** Wraps the form that starts an agreement, e.g. to offer a plan instead. */
  wrapStart?: (form: ReactElement) => ReactNode;
}

const asIs = (form: ReactElement): ReactNode => form;

/** Written agreements with the people in someone's life: confirmed by each, revisited together. */
export function AgreementsPage({ people = [], wrapStart = asIs }: AgreementsPageProps): ReactNode {
  const { data: user } = useUser();
  const agreements = useAgreements();
  const me = user?.id ?? '';
  const refresh = async (): Promise<unknown> => agreements.mutate();
  const nameOf: NameOf = (userId) =>
    userId === me ? 'You' : (people.find((person) => person.userId === userId)?.name ?? 'Someone');
  return (
    <div className='grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-3xl font-semibold'>Agreements</h1>
        <p className='text-muted-foreground'>
          Write down what you have agreed, likes and limits included. Any change asks everyone to confirm again, so nothing
          shifts without each of you knowing.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Start an agreement</CardTitle>
          <CardDescription>Only the people in it ever see it.</CardDescription>
        </CardHeader>
        <CardContent>{wrapStart(<StartAgreement people={people} onStarted={refresh} />)}</CardContent>
      </Card>
      {agreements.error !== undefined && <Problem problem={agreements.error.message} />}
      {agreements.data?.length === 0 && <p className='text-sm text-muted-foreground'>No agreements yet.</p>}
      {(agreements.data ?? []).map((agreement) => (
        <AgreementCard
          key={agreement.id}
          agreement={agreement}
          me={me}
          people={people}
          nameOf={nameOf}
          onChanged={refresh}
        />
      ))}
    </div>
  );
}
