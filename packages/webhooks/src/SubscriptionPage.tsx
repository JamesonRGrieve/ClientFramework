// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useState } from 'react';
import { type ConflictField, ConflictPanel, useDraft, useEditBase } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Deliveries } from './Deliveries';
import { WEBHOOKS_PATH } from './routes';
import { SubscriptionFields } from './SubscriptionFields';
import { draftProblem, type SubscriptionDraft, subscriptionChanges } from './webhookModel';
import { type EditableSubscription, type Subscription, useSubscription, useSubscriptionActions } from './webhooksApi';

const SAVE_FAILURE = 'The subscription could not be saved.';
const REMOVE_FAILURE = 'The subscription could not be removed.';

const CONFLICT_FIELDS: readonly ConflictField<EditableSubscription>[] = [
  { key: 'target_url', label: 'Deliver to' },
  { key: 'event_types', label: 'Events' },
  { key: 'active', label: 'Delivering', format: ({ active }) => (active === true ? 'Yes' : 'No') },
];

const draftOf = ({ target_url: url, event_types: events, active }: Subscription): SubscriptionDraft => ({
  target_url: url,
  event_types: events,
  active,
  secret: '',
});

/** Change a subscription, saved over it as loaded, or remove it. */
function SubscriptionEditor({ subscription }: { subscription: Subscription }): ReactElement {
  const router = useRouter();
  const { update, remove } = useSubscriptionActions(subscription.id);
  const { base, rebaseOnSave } = useEditBase(subscription);
  const [draft, setDraft] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);

  const settleSave = async (saving: Promise<boolean>): Promise<void> => {
    try {
      setNotice((await rebaseOnSave(saving)) ? { text: 'Saved.', alert: false } : null);
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : SAVE_FAILURE, alert: true });
    }
  };
  const settleRemove = async (removing: Promise<boolean>): Promise<void> => {
    try {
      if (await removing) {
        router.push(WEBHOOKS_PATH);
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = draftProblem(draft, false);
    if (wrong !== null) {
      setNotice({ text: wrong, alert: true });
      return;
    }
    const changes = subscriptionChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  // The conflict panels sit beside the form, not in it: their choices are not the form's fields.
  return (
    <div className='grid gap-3'>
      <form aria-label='Subscription' className='grid gap-3' noValidate onSubmit={submit}>
        <SubscriptionFields
          draft={draft}
          secretRequired={false}
          onChange={(next) => {
            setDraft(next);
            setNotice(null);
          }}
        />
        <div className='flex flex-wrap gap-2'>
          <Button type='submit'>Save</Button>
          <Button
            type='button'
            variant='outline'
            className='ml-auto'
            onClick={() => {
              setNotice(null);
              void settleRemove(remove.save(subscription, {}));
            }}
          >
            Remove subscription
          </Button>
        </div>
      </form>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={CONFLICT_FIELDS}
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
          applyLabel='Remove anyway'
          onResolve={(merged) => {
            void settleRemove(remove.resolve(merged));
          }}
          onDiscard={remove.discard}
        />
      )}
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
          {notice.text}
        </p>
      )}
    </div>
  );
}

/** One subscription: its settings, and what has been sent to it. */
export function SubscriptionPage({ params }: { params: Record<string, string> }): ReactElement {
  const subscriptionId = params['subscriptionId'] ?? '';
  const { data: subscription, error, isLoading } = useSubscription(subscriptionId);

  if (error !== undefined) {
    return (
      <p role='alert' className='p-4 text-sm text-destructive'>
        The subscription could not be loaded: {error.message}
      </p>
    );
  }
  if (subscription === undefined || subscription === null) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'This subscription does not exist or is not yours.'}{' '}
        <Link href={WEBHOOKS_PATH} className='underline'>
          Back to your webhooks
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={WEBHOOKS_PATH} className='text-sm text-muted-foreground underline'>
          Webhooks
        </Link>
        <h1 className='break-all text-2xl font-semibold'>{subscription.target_url}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionEditor key={subscription.id} subscription={subscription} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Deliveries</CardTitle>
          <CardDescription>What has been sent to this endpoint, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Deliveries subscriptionId={subscription.id} />
        </CardContent>
      </Card>
    </main>
  );
}
