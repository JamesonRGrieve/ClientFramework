// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { ReactElement } from 'react';
import { serverInstant } from 'zephyrex';
import { type Delivery, useDeliveries } from './webhooksApi';

const STATUS_LABELS: Readonly<Record<Delivery['status'], string>> = {
  pending: 'Pending',
  delivered: 'Delivered',
  dead: 'Gave up',
};

const shownTime = (value: string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '' : serverInstant(value).toLocaleString();

/** Where a delivery stands, in words: when it was accepted, when it is next tried, or that it was given up on. */
export function deliveryProgress(delivery: Delivery): string {
  const tries = delivery.attempts === 1 ? '1 attempt' : `${String(delivery.attempts)} attempts`;
  if (delivery.status === 'delivered') {
    return `Delivered ${shownTime(delivery.delivered_at)} · ${tries}`;
  }
  if (delivery.status === 'dead') {
    return `Gave up after ${tries}`;
  }
  return delivery.attempts === 0 ? 'Queued' : `${tries}; next try ${shownTime(delivery.next_attempt_at)}`;
}

/** A subscription's deliveries, newest first: each event, where it stands, why it last failed, and what was sent. */
export function Deliveries({ subscriptionId }: { subscriptionId: string }): ReactElement {
  const { data: deliveries = [], error, isLoading } = useDeliveries(subscriptionId);

  return (
    <div className='grid gap-3'>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The deliveries could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && deliveries.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'Nothing has been sent yet.'}</p>
      )}
      {deliveries.length > 0 && (
        <ul aria-label='Deliveries' className='divide-y rounded-md border'>
          {deliveries.map((delivery) => (
            <li key={delivery.id} className='grid gap-1 px-4 py-3 text-sm'>
              <div className='flex flex-wrap items-baseline justify-between gap-2'>
                <span className='font-medium'>{delivery.event_type}</span>
                <span className={delivery.status === 'dead' ? 'text-destructive' : 'text-muted-foreground'}>
                  {STATUS_LABELS[delivery.status]}
                </span>
              </div>
              <span className='text-xs text-muted-foreground'>{deliveryProgress(delivery)}</span>
              {(delivery.last_error ?? '') !== '' && delivery.status !== 'delivered' && (
                <span className='text-xs text-destructive'>Last error: {delivery.last_error}</span>
              )}
              <details>
                <summary className='cursor-pointer text-xs'>Payload</summary>
                <pre className='mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs'>
                  {delivery.payload}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
