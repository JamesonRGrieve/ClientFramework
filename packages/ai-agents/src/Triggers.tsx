// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { ConflictPanel, shownTime, useClient, writeProblem } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import { NEW_TRIGGER, type TriggerDraft, triggerFields, triggerProblem } from './triggerModel';
import {
  createTrigger,
  EVENT_SOURCES,
  HIGHEST_PRIORITY,
  LOWEST_PRIORITY,
  newWebhookSecret,
  type Trigger,
  TRIGGER_TYPES,
  useTriggerActions,
  useTriggers,
  type WebhookSecret,
} from './triggersApi';
import { triggerSummary } from './turnDisplay';

const INSTRUCTION_ROWS = 2;
const PRIORITIES = Array.from({ length: LOWEST_PRIORITY - HIGHEST_PRIORITY + 1 }, (_, index) => HIGHEST_PRIORITY + index);

const TYPE_LABELS: Readonly<Record<TriggerDraft['type'], string>> = {
  schedule: 'On a schedule',
  timer: 'After a time',
  event: 'When something happens',
};
const SOURCE_LABELS: Readonly<Record<TriggerDraft['source'], string>> = {
  conversation_message: 'A message in a conversation it takes part in',
  webhook: 'A signed call to its webhook',
  email: 'An email',
};

/** A webhook trigger's new secret, shown once, with how a caller signs. */
function SecretShownOnce({ secret }: { secret: WebhookSecret }): ReactElement {
  return (
    <div role='status' className='grid gap-1 rounded border p-3 text-xs'>
      <p className='font-medium'>Copy this secret now: it is never shown again.</p>
      <code className='break-all'>{secret.secret}</code>
      <p className='text-muted-foreground'>
        Callers send {secret.timestamp_header} (Unix seconds) and {secret.signature_header}: sha256= the HMAC-SHA256 of the
        timestamp, a dot and the body, keyed by the secret.
      </p>
    </div>
  );
}

/** One trigger: what fires it and when, switching it on or off, a webhook's secret, and deleting it. */
function TriggerRow({ trigger }: { trigger: Trigger }): ReactElement {
  const client = useClient();
  const id = useId();
  const { update, remove } = useTriggerActions(trigger.agent_id);
  const [secret, setSecret] = useState<WebhookSecret | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const settle = (writing: Promise<boolean | undefined>, fallback: string): void => {
    void writeProblem(writing, fallback).then(setProblem);
  };
  const isWebhook = trigger.invocation_type === 'event' && trigger.event_source === 'webhook';

  return (
    <li className='grid gap-2 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='font-medium'>{triggerSummary(trigger)}</span>
        <div className='flex items-center gap-2'>
          <input
            id={id}
            type='checkbox'
            checked={trigger.enabled}
            onChange={() => settle(update.save(trigger, { enabled: !trigger.enabled }), 'The trigger could not be changed.')}
          />
          <Label htmlFor={id}>On</Label>
        </div>
      </div>
      {(trigger.invocation_payload ?? '') !== '' && <p className='whitespace-pre-wrap'>{trigger.invocation_payload}</p>}
      <span className='text-xs text-muted-foreground'>
        {[
          `priority ${String(trigger.priority)}`,
          (trigger.next_fire_at ?? '') === '' ? '' : `next ${shownTime(trigger.next_fire_at)}`,
          trigger.fire_count === 1 ? 'fired once' : `fired ${String(trigger.fire_count)} times`,
        ]
          .filter((part) => part !== '')
          .join(' · ')}
      </span>
      {(trigger.email_address ?? '') !== '' && (
        <span className='text-xs'>
          Mail to <code>{trigger.email_address}</code>
        </span>
      )}
      <div className='flex flex-wrap gap-2'>
        {isWebhook && (
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() =>
              settle(
                (async (): Promise<undefined> => {
                  setSecret(await newWebhookSecret(client, trigger.id));
                  return undefined;
                })(),
                'A new secret could not be made.',
              )
            }
          >
            New signing secret
          </Button>
        )}
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={() => settle(remove.save(trigger, {}), 'The trigger could not be deleted.')}
        >
          Delete
        </Button>
      </div>
      {secret !== null && <SecretShownOnce secret={secret} />}
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={[{ key: 'enabled', label: 'On', format: ({ enabled }) => (enabled === true ? 'Yes' : 'No') }]}
          onResolve={(merged) => settle(update.resolve(merged), 'The trigger could not be changed.')}
          onDiscard={update.discard}
        />
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Delete anyway'
          onResolve={(merged) => settle(remove.resolve(merged), 'The trigger could not be deleted.')}
          onDiscard={remove.discard}
        />
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** A labelled choice. */
function Choice<V extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: readonly { value: V; label: string }[];
  onChange: (value: V) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className='rounded-md border bg-background px-2 py-2 text-sm'
        value={String(value)}
        onChange={(event) => {
          const picked = options.find((option) => String(option.value) === event.target.value);
          if (picked !== undefined) {
            onChange(picked.value);
          }
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** A labelled text input. */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'datetime-local';
  hint?: string;
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint !== undefined && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </div>
  );
}

/** Make a trigger: what fires it, the instructions it hands the turn, when it is first due and its priority. */
function NewTriggerForm({ agentId }: { agentId: string }): ReactElement {
  const client = useClient();
  const ids = { instructions: useId(), oneShot: useId() };
  const { mutate: refreshTriggers } = useTriggers(agentId);
  const [draft, setDraft] = useState<TriggerDraft>(NEW_TRIGGER);
  const [problem, setProblem] = useState<string | null>(null);
  const set = <K extends keyof TriggerDraft>(field: K, value: TriggerDraft[K]): void => {
    setDraft((current) => ({ ...current, [field]: value }));
    setProblem(null);
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = triggerProblem(draft);
    if (wrong !== null) {
      setProblem(wrong);
      return;
    }
    const making = (async (): Promise<void> => {
      await createTrigger(client, agentId, triggerFields(draft));
      await refreshTriggers();
      setDraft(NEW_TRIGGER);
    })();
    void writeProblem(making, 'The trigger could not be made.').then(setProblem);
  };

  return (
    <form aria-label='New trigger' className='grid gap-3' noValidate onSubmit={submit}>
      <Choice
        label='Fires'
        value={draft.type}
        options={TRIGGER_TYPES.map((type) => ({ value: type, label: TYPE_LABELS[type] }))}
        onChange={(type) => set('type', type)}
      />
      {draft.type === 'schedule' && (
        <Field
          label='Cron expression'
          value={draft.cron}
          onChange={(cron) => set('cron', cron)}
          hint='Minute, hour, day of month, month, day of week: 0 9 * * 1 is 9:00 every Monday.'
        />
      )}
      {draft.type === 'timer' && (
        <>
          <Field
            label='Every (minutes)'
            type='number'
            value={draft.intervalMinutes}
            onChange={(minutes) => set('intervalMinutes', minutes)}
          />
          <div className='flex items-center gap-2'>
            <input
              id={ids.oneShot}
              type='checkbox'
              checked={draft.oneShot}
              onChange={(event) => set('oneShot', event.target.checked)}
            />
            <Label htmlFor={ids.oneShot}>Only once</Label>
          </div>
        </>
      )}
      {draft.type === 'event' && (
        <Choice
          label='When'
          value={draft.source}
          options={EVENT_SOURCES.map((source) => ({ value: source, label: SOURCE_LABELS[source] }))}
          onChange={(source) => set('source', source)}
        />
      )}
      {draft.type === 'event' && draft.source === 'email' && (
        <>
          <Field
            label='From (an address or @domain; optional)'
            value={draft.emailFrom}
            onChange={(from) => set('emailFrom', from)}
          />
          <Field
            label='Subject contains (optional)'
            value={draft.emailSubject}
            onChange={(subject) => set('emailSubject', subject)}
          />
        </>
      )}
      {draft.type !== 'event' && (
        <Field
          label='First due (optional)'
          type='datetime-local'
          value={draft.dueAt}
          onChange={(due) => set('dueAt', due)}
        />
      )}
      <div className='grid gap-1'>
        <Label htmlFor={ids.instructions}>Instructions (optional)</Label>
        <Textarea
          id={ids.instructions}
          rows={INSTRUCTION_ROWS}
          value={draft.instructions}
          onChange={(event) => set('instructions', event.target.value)}
        />
      </div>
      <Choice
        label='Priority'
        value={draft.priority}
        options={PRIORITIES.map((priority) => ({
          value: priority,
          label: priority === HIGHEST_PRIORITY ? `${String(priority)} (most urgent)` : String(priority),
        }))}
        onChange={(priority) => set('priority', priority)}
      />
      <div>
        <Button type='submit'>Make trigger</Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** What makes the agent take turns by itself, and making another. */
export function Triggers({ agentId }: { agentId: string }): ReactElement {
  const { data: triggers = [], error, isLoading } = useTriggers(agentId);
  return (
    <div className='grid gap-4'>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The triggers could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && triggers.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          {isLoading ? 'Loading…' : 'No triggers: it takes turns only when asked.'}
        </p>
      )}
      {triggers.length > 0 && (
        <ul aria-label='Triggers' className='divide-y rounded-md border'>
          {triggers.map((trigger) => (
            <TriggerRow key={trigger.id} trigger={trigger} />
          ))}
        </ul>
      )}
      <NewTriggerForm agentId={agentId} />
    </div>
  );
}
