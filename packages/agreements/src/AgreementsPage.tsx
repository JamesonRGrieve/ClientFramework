// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { chipGroup } from 'zephyrex/hooks/chipKeys';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
  useId,
  useState,
} from 'react';
import { useClient, useUser, writeProblem } from 'zephyrex';
import { deferWithUndo, notify } from 'zephyrex/hooks/useToast';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'zephyrex/ui/dialog';
import { Input } from 'zephyrex/ui/input';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { Textarea } from 'zephyrex/ui/textarea';
import { agreementsApi, useAgreements } from './agreementsApi';
import {
  type Agreement,
  type AgreementPerson,
  DEFAULT_KINDS,
  dueForRevisit,
  shownKind,
  type Term,
  type TermKindInfo,
} from './agreementsModel';

/** A term's wording: one line high until it needs more, like an input that wraps. */
const GROWING = 'field-sizing-content min-h-9 resize-none py-2';

/** Enter saves the term; Shift+Enter starts a new line. */
const submitOnEnter = (event: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
};

/** When to look at an agreement again, one tap each; any other day is picked in the date field. */
const REVISIT_IN = [
  { months: 1, label: 'In a month' },
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: 'A year' },
];
const REVISIT_CHIP =
  'rounded-full border px-3 py-1 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground';

/** Today plus `months`, as the date field's YYYY-MM-DD. */
const monthsFromToday = (months: number): string => {
  const day = new Date();
  day.setMonth(day.getMonth() + months);
  return `${String(day.getFullYear())}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
};

function RevisitPicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <div className='grid min-w-0 gap-1 text-sm font-medium'>
      <label htmlFor={id}>{label}</label>
      <div className='flex flex-wrap items-center gap-1.5' ref={chipGroup}>
        {REVISIT_IN.map((choice) => (
          <button
            key={choice.months}
            type='button'
            aria-pressed={value === monthsFromToday(choice.months)}
            onClick={() => onChange(monthsFromToday(choice.months))}
            className={REVISIT_CHIP}
          >
            {choice.label}
          </button>
        ))}
        <Input id={id} type='date' value={value} onChange={(event) => onChange(event.target.value)} className='h-8 w-40' />
      </div>
    </div>
  );
}

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

/** The choice of a term's kind, among the kinds the app names: one tap each. */
function KindSelect({
  id,
  kinds,
  value,
  onChange,
}: {
  id: string;
  kinds: readonly TermKindInfo[];
  value: string;
  onChange: (kind: string) => void;
}): ReactNode {
  return (
    <div role='radiogroup' aria-label='Kind' id={id} className='col-span-full flex flex-wrap gap-1.5'>
      {kinds.map((k) => (
        <ChoiceChip
          key={k.value}
          checked={k.value === value}
          onClick={() => onChange(k.value)}
          className='rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-foreground'
        >
          {k.choice}
        </ChoiceChip>
      ))}
    </div>
  );
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
        <div className='col-span-full'>
          <RevisitPicker id={ids.revisit} label='Revisit by (optional)' value={revisit} onChange={setRevisit} />
        </div>
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
                <input
                  type='checkbox'
                  className='size-4 accent-primary'
                  checked={chosen.includes(person.userId)}
                  onChange={() => toggle(person.userId)}
                />
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

function TermRow({
  term,
  kinds,
  nameOf,
  onChanged,
}: {
  term: Term;
  kinds: readonly TermKindInfo[];
  nameOf: NameOf;
  onChanged: () => Promise<unknown>;
}): ReactNode {
  const client = useClient();
  const ids = { kind: useId(), text: useId() };
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState(shownKind(term.kind, kinds));
  const [text, setText] = useState(term.text);
  const { busy, problem, run } = useWrite(onChanged);
  // Taken out, but still within its undo window: hidden until the notice goes or Undo brings it back.
  const [leaving, setLeaving] = useState(false);
  const save = (event: SyntheticEvent): void => {
    event.preventDefault();
    void (async (): Promise<void> => {
      if (await run(agreementsApi.changeTerm(client, term.id, { kind, text: text.trim() }), 'That could not be saved.')) {
        notify('Change saved', 'Everyone confirms the new version.');
        setEditing(false);
      }
    })();
  };
  if (leaving && problem === null) {
    return null;
  }
  if (editing) {
    return (
      <li className='py-2'>
        <form
          onSubmit={save}
          aria-label={`Change “${term.text}”`}
          className='grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]'
        >
          <KindSelect id={ids.kind} kinds={kinds} value={kind} onChange={setKind} />
          <label htmlFor={ids.text} className='sr-only'>
            Wording
          </label>
          <Textarea
            id={ids.text}
            rows={1}
            className={GROWING}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={submitOnEnter}
            maxLength={2000}
            required
          />
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
    <li className='group grid gap-1 py-2'>
      <span>{term.text}</span>
      <span className='flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground'>
        <span>Written by {nameOf(term.written_by) === 'You' ? 'you' : nameOf(term.written_by)}</span>
        {/* With a mouse, the actions show on the row being pointed at or tabbed into; on touch, always. */}
        <span className='flex items-center gap-x-3 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'>
          <button
            type='button'
            className='underline-offset-2 hover:text-foreground hover:underline'
            onClick={() => setEditing(true)}
            aria-label={`Change “${term.text}”`}
          >
            Change
          </button>
          <button
            type='button'
            className='underline-offset-2 hover:text-destructive hover:underline disabled:opacity-50'
            disabled={busy}
            aria-label={`Take out “${term.text}”`}
            onClick={() => {
              setLeaving(true);
              deferWithUndo(
                `“${term.text}” taken out`,
                () => {
                  void run(agreementsApi.removeTerm(client, term.id), 'That could not be taken out.');
                },
                () => {
                  setLeaving(false);
                },
              );
            }}
          >
            Take out
          </button>
        </span>
      </span>
      <Problem problem={problem} />
    </li>
  );
}

function AddTerm({
  agreement,
  kinds,
  onChanged,
}: {
  agreement: Agreement;
  kinds: readonly TermKindInfo[];
  onChanged: () => Promise<unknown>;
}): ReactNode {
  const client = useClient();
  const ids = { kind: useId(), text: useId() };
  const [kind, setKind] = useState(kinds.at(0)?.value ?? 'term');
  const [text, setText] = useState('');
  const { busy, problem, run } = useWrite(onChanged);
  const add = (event: SyntheticEvent): void => {
    event.preventDefault();
    void (async (): Promise<void> => {
      if (await run(agreementsApi.addTerm(client, agreement.id, kind, text.trim()), 'That could not be added.')) {
        notify('Added', text.trim());
        setText('');
      }
    })();
  };
  return (
    <form onSubmit={add} aria-label={`Add to ${agreement.title}`} className='grid gap-2'>
      <KindSelect id={ids.kind} kinds={kinds} value={kind} onChange={setKind} />
      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
        <label htmlFor={ids.text} className='sr-only'>
          New term
        </label>
        <Textarea
          id={ids.text}
          rows={1}
          className={GROWING}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={submitOnEnter}
          placeholder='Something agreed'
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
  const ids = { revisit: useId() };
  const [revisit, setRevisit] = useState(agreement.revisit_on ?? '');
  const { busy, problem, run } = useWrite(onChanged);
  const inIt = new Set(agreement.parties.map((p) => p.user_id));
  const addable = people.filter((person) => !inIt.has(person.userId));
  return (
    <div className='grid gap-3 border-t pt-4'>
      <div className='flex flex-wrap items-end gap-2'>
        <RevisitPicker id={ids.revisit} label='Revisit by' value={revisit} onChange={setRevisit} />
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
        <fieldset aria-label='Add someone' className='min-w-0 grid gap-1.5'>
          <span className='text-sm font-medium'>Add someone</span>
          <div className='flex flex-wrap gap-1.5' ref={chipGroup}>
            {addable.map((person) => (
              <button
                key={person.userId}
                type='button'
                disabled={busy}
                aria-label={`Add ${person.name}`}
                onClick={() =>
                  void (async (): Promise<void> => {
                    if (await run(agreementsApi.addParty(client, agreement.id, person.userId), 'They could not be added.')) {
                      notify('Added to the agreement', `${person.name} confirms it like everyone else.`);
                    }
                  })()
                }
                className='rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-55'
              >
                <span aria-hidden='true' className='text-primary'>
                  +{' '}
                </span>
                {person.name}
              </button>
            ))}
          </div>
        </fieldset>
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
  kinds,
  me,
  people,
  nameOf,
  onChanged,
}: {
  agreement: Agreement;
  kinds: readonly TermKindInfo[];
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
      <CardHeader className='flex-row flex-wrap items-start justify-between gap-3 space-y-0'>
        <div className='grid gap-1.5'>
          <h2 className='text-2xl font-semibold leading-none tracking-tight'>{agreement.title}</h2>
          <CardDescription>{others.length === 0 ? 'Just you, so far.' : `With ${listed(others)}.`}</CardDescription>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            due
              ? 'bg-destructive text-destructive-foreground'
              : agreement.in_effect
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          {due ? 'Revisit due' : agreement.in_effect ? 'Confirmed' : `Waiting on ${String(waiting.length)}`}
        </span>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <div role='status' aria-label={`Where ${agreement.title} stands`} className='grid gap-1 text-sm'>
          {agreement.in_effect ? (
            <span className='sr-only'>Everyone has confirmed this version.</span>
          ) : (
            <span className='sr-only'>Waiting for {listed(waiting)} to confirm.</span>
          )}
          {/* Who has confirmed this version, one chip each, so who is left is plain at a glance. */}
          <ul aria-hidden='true' className='flex flex-wrap gap-1.5'>
            {agreement.parties.map((party) => (
              <li
                key={party.user_id}
                className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1 text-xs ${
                  party.confirmed ? 'border-primary/40 bg-primary/10 text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[0.6rem] font-semibold ${
                    party.confirmed ? 'bg-primary text-primary-foreground' : 'border border-dashed'
                  }`}
                >
                  {party.confirmed ? '✓' : nameOf(party.user_id).charAt(0)}
                </span>
                {nameOf(party.user_id)}
                <span className='text-muted-foreground'>{party.confirmed ? 'Confirmed' : 'To confirm'}</span>
              </li>
            ))}
          </ul>
          {agreement.revisit_on !== null && agreement.revisit_on !== undefined && (
            <span className={due ? 'font-medium text-destructive' : 'text-muted-foreground'}>
              {due ? 'Time to revisit it' : 'Revisit by'} {longDate(agreement.revisit_on)}.
            </span>
          )}
        </div>
        <div className='grid gap-4 lg:grid-cols-3'>
          {kinds.map((kind) => {
            const terms = agreement.terms.filter((t) => shownKind(t.kind, kinds) === kind.value);
            return terms.length === 0 ? null : (
              <section
                key={kind.value}
                aria-label={`${agreement.title}: ${kind.heading}`}
                className='grid content-start gap-1 rounded-lg border bg-muted/20 p-3'
              >
                <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>{kind.heading}</h3>
                <ul className='divide-y'>
                  {terms.map((term) => (
                    <TermRow
                      key={`${term.id}-${String(agreement.version)}`}
                      term={term}
                      kinds={kinds}
                      nameOf={nameOf}
                      onChanged={onChanged}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        {agreement.terms.length === 0 && <p className='text-sm text-muted-foreground'>Nothing written down yet.</p>}
        <AddTerm agreement={agreement} kinds={kinds} onChanged={onChanged} />
        <div className='flex flex-wrap items-center gap-3'>
          {mine?.confirmed === true ? (
            <span className='text-sm text-muted-foreground'>You confirmed this version.</span>
          ) : (
            <Button
              type='button'
              disabled={busy}
              onClick={() =>
                void (async (): Promise<void> => {
                  if (await run(agreementsApi.confirm(client, agreement.id), 'Your confirmation could not be saved.')) {
                    notify('Confirmed', `You confirmed ${agreement.title}.`);
                  }
                })()
              }
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
  /** The kinds of term, in the order they show; the same values the server's register_term_kinds names. */
  kinds?: readonly TermKindInfo[];
  /** What the page says under its heading. */
  intro?: ReactNode;
}

const INTRO =
  'Write down what you have agreed. Any change asks everyone to confirm again, so nothing shifts without each of you knowing.';

const asIs = (form: ReactElement): ReactNode => form;

/** Written agreements between people: confirmed by each, revisited together. */
export function AgreementsPage({
  people = [],
  wrapStart = asIs,
  kinds = DEFAULT_KINDS,
  intro = INTRO,
}: AgreementsPageProps): ReactNode {
  const { data: user } = useUser();
  const agreements = useAgreements();
  const me = user?.id ?? '';
  const refresh = async (): Promise<unknown> => agreements.mutate();
  const [starting, setStarting] = useState(false);
  const nameOf: NameOf = (userId) =>
    userId === me ? 'You' : (people.find((person) => person.userId === userId)?.name ?? 'Someone');
  return (
    <div className='grid gap-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='grid gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>Agreements</h1>
          <p className='max-w-prose text-muted-foreground'>{intro}</p>
        </div>
        {(agreements.data?.length ?? 0) > 0 && (
          <Dialog open={starting} onOpenChange={setStarting}>
            <DialogTrigger asChild>
              <Button type='button'>Start an agreement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start an agreement</DialogTitle>
                <DialogDescription>Only the people in it ever see it.</DialogDescription>
              </DialogHeader>
              {wrapStart(
                <StartAgreement
                  people={people}
                  onStarted={async () => {
                    setStarting(false);
                    await refresh();
                  }}
                />,
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
      {agreements.error === undefined && agreements.data === undefined && (
        <SkeletonRows rows={3} label='Loading your agreements' />
      )}
      {agreements.data?.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Start your first agreement</CardTitle>
            <CardDescription>Only the people in it ever see it.</CardDescription>
          </CardHeader>
          <CardContent>{wrapStart(<StartAgreement people={people} onStarted={refresh} />)}</CardContent>
        </Card>
      )}
      {agreements.error !== undefined && (
        <LoadProblem what='your agreements' error={agreements.error} onRetry={async () => agreements.mutate()} />
      )}
      {(agreements.data ?? []).map((agreement) => (
        <AgreementCard
          key={agreement.id}
          agreement={agreement}
          kinds={kinds}
          me={me}
          people={people}
          nameOf={nameOf}
          onChanged={refresh}
        />
      ))}
    </div>
  );
}
