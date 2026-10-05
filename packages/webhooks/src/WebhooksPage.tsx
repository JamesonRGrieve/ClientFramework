// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { subscriptionPagePath } from './routes';
import { SubscriptionFields } from './SubscriptionFields';
import { ALL_EVENTS, draftProblem, normalisedEventTypes, type SubscriptionDraft } from './webhookModel';
import { createSubscription, useSubscriptions } from './webhooksApi';

const NEW_DRAFT: SubscriptionDraft = { target_url: '', event_types: ALL_EVENTS, active: true, secret: '' };

/** Subscribe an endpoint, then on to its page to watch its deliveries. */
function NewSubscriptionForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { mutate: refreshSubscriptions } = useSubscriptions();
  const [draft, setDraft] = useState(NEW_DRAFT);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = draftProblem(draft, true);
    if (wrong !== null) {
      setProblem(wrong);
      return;
    }
    setPending(true);
    const creating = (async (): Promise<void> => {
      const made = await createSubscription(client, {
        target_url: draft.target_url.trim(),
        event_types: normalisedEventTypes(draft.event_types),
        secret: draft.secret,
        active: draft.active,
      });
      await refreshSubscriptions();
      router.push(subscriptionPagePath(made.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(creating, 'The subscription could not be made.'));
      setPending(false);
    })();
  };

  return (
    // noValidate: the form's own checks say what's wrong, in the server's terms.
    <form aria-label='New subscription' className='grid gap-3' noValidate onSubmit={submit}>
      <SubscriptionFields
        draft={draft}
        secretRequired
        onChange={(next) => {
          setDraft(next);
          setProblem(null);
        }}
      />
      <div>
        <Button type='submit' disabled={pending}>
          Subscribe
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

/** The user's webhook subscriptions, each opening its page, and a form to add one. */
export function WebhooksPage(): ReactElement {
  const { data: subscriptions = [], error, isLoading } = useSubscriptions();

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Endpoints your events are sent to. Each delivery is a signed POST, retried until it is accepted.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The subscriptions could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && subscriptions.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              {isLoading ? 'Loading…' : 'You have no webhook subscriptions yet.'}
            </p>
          )}
          {subscriptions.length > 0 && (
            <ul aria-label='Subscriptions' className='divide-y rounded-md border'>
              {subscriptions.map((subscription) => (
                <li key={subscription.id} className='grid gap-1 px-4 py-3 text-sm'>
                  <Link href={subscriptionPagePath(subscription.id)} className='break-all font-medium hover:underline'>
                    {subscription.target_url}
                  </Link>
                  <span className='text-muted-foreground'>
                    {subscription.active ? 'Delivering' : 'Paused'} · {subscription.event_types}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add a subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <NewSubscriptionForm />
        </CardContent>
      </Card>
    </main>
  );
}
