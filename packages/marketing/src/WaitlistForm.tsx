'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import { type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { writeProblem } from 'zephyrex';
import { chipGroup } from 'zephyrex/hooks/chipKeys';
import { Button } from 'zephyrex/ui/button';
import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { Input } from 'zephyrex/ui/input';
import { Label } from 'zephyrex/ui/label';
import { z } from 'zod';
import { Heading, type HeadingLevel } from './Heading';
import { WAITLIST_PATH, type WaitlistEntry } from './waitlist';

/** The framework's refusal shape: `{ detail: { message } }`, the reason to show the visitor. */
const Refusal = z.object({ detail: z.object({ message: z.string() }) });

export interface WaitlistFormProps {
  /** What it says above the form, e.g. "Accounts are waitlist only for now". */
  title: string;
  /** Why there's a waitlist and what the person gets by joining. */
  body: ReactNode;
  level?: HeadingLevel;
  /** The button's words. */
  submitLabel?: string;
  /**
   * What the person agrees to by ticking the box, which they must: by default, one email when it
   * opens, with their details kept for that alone (see `privacyHref`).
   */
  consent?: ReactNode;
  /** The app's privacy policy, which the default consent wording links to. */
  privacyHref?: string;
  /**
   * The things a person can wait for, by key, with their words (the route's `interests`). Without a
   * fixed `interest`, the form shows them as chips to choose from.
   */
  interests?: Readonly<Record<string, string>>;
  /** The one thing this form is for (a paywall's form): sent with the entry, with no picker shown. */
  interest?: string;
  /** The chip chosen to start with, e.g. from a `/waitlist?offer=` link; the first declared one otherwise. */
  initialInterest?: string;
  /** The picker's label. */
  interestLabel?: string;
}

/** A form field's text, trimmed; '' for a missing field or a file. */
function fieldText(data: FormData, field: string): string {
  const value = data.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/** Posts the entry to the app's waitlist route; a refusal throws with the server's reason. */
async function join(entry: WaitlistEntry): Promise<void> {
  const answer = await fetch(WAITLIST_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(entry),
  });
  if (answer.ok) {
    return;
  }
  const reply = Refusal.safeParse(await answer.json().catch(() => null));
  throw new Error(
    reply.success ? reply.data.detail.message : 'You could not be added to the waitlist. Try again in a few minutes.',
  );
}

/**
 * The way in while an app's accounts, or a paid plan, aren't open: an email (and a name, if the
 * person wants), with their consent to be emailed, that becomes a lead in the operator's CRM, through the app's own waitlist route
 * (createWaitlistRoute at WAITLIST_PATH). It says plainly when the person is on the list, and why
 * not when they aren't.
 */
export function WaitlistForm({
  title,
  body,
  level = 2,
  submitLabel = 'Join the waitlist',
  consent,
  privacyHref = '/docs/privacy',
  interests,
  interest,
  initialInterest,
  interestLabel = 'What would you like?',
}: WaitlistFormProps): ReactNode {
  const id = useId();
  const choices = interest === undefined && interests !== undefined ? Object.entries(interests) : [];
  // The given interest when it is one of the choices, else the first one declared.
  const [chosen, setChosen] = useState<string | undefined>(
    choices.some(([key]) => key === initialInterest) ? initialInterest : choices.at(0)?.[0],
  );
  const wanted = interest ?? chosen;
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);

  const submit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = fieldText(data, 'email');
    const name = fieldText(data, 'name');
    setBusy(true);
    const failed = await writeProblem(
      join({
        email,
        ...(name === '' ? {} : { name }),
        consent: true,
        ...(wanted === undefined ? {} : { interest: wanted }),
      }),
      'You could not be added to the waitlist',
    );
    setBusy(false);
    setProblem(failed);
    if (failed === null) {
      setJoined(email);
    }
  };

  return (
    <section aria-labelledby={`${id}-title`} className='rounded-2xl border p-8'>
      <Heading level={level} id={`${id}-title`} className='text-2xl font-bold'>
        {title}
      </Heading>
      <div className='mt-2 text-muted-foreground'>{body}</div>
      {joined === null ? (
        <form className='mt-6 grid max-w-md gap-4' onSubmit={(event) => void submit(event)}>
          <div className='grid gap-2'>
            <Label htmlFor={`${id}-email`}>Email</Label>
            <Input id={`${id}-email`} name='email' type='email' autoComplete='email' required maxLength={254} />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={`${id}-name`}>Name (optional)</Label>
            <Input id={`${id}-name`} name='name' autoComplete='name' maxLength={140} />
          </div>
          {choices.length > 0 && (
            <div className='grid gap-2'>
              <span id={`${id}-interest`} className='text-sm font-medium'>
                {interestLabel}
              </span>
              <div role='radiogroup' aria-labelledby={`${id}-interest`} ref={chipGroup} className='flex flex-wrap gap-2'>
                {choices.map(([key, words]) => (
                  <ChoiceChip
                    key={key}
                    checked={chosen === key}
                    onClick={() => setChosen((current) => (current === key ? undefined : key))}
                  >
                    {words}
                  </ChoiceChip>
                ))}
              </div>
            </div>
          )}
          <label className='flex items-start gap-3 text-sm'>
            {/* Required, so the browser asks for it before anything is sent; the route checks it again. */}
            <input type='checkbox' name='consent' required className='mt-0.5 size-4 shrink-0 accent-primary' />
            <span>
              {consent ?? (
                <>
                  Email me when it opens. My email and name are kept in the customer records for that and nothing else (see
                  the{' '}
                  <Link href={privacyHref} className='underline underline-offset-2'>
                    privacy policy
                  </Link>
                  ).
                </>
              )}
            </span>
          </label>
          {problem !== null && (
            <p role='alert' className='text-sm text-destructive wrap-anywhere'>
              {problem}
            </p>
          )}
          <Button type='submit' disabled={busy} className='justify-self-start'>
            {busy ? 'Adding you…' : submitLabel}
          </Button>
        </form>
      ) : (
        <p role='status' className='mt-6 wrap-anywhere'>
          You’re on the waitlist. We’ll write to {joined} when it opens.
        </p>
      )}
    </section>
  );
}
