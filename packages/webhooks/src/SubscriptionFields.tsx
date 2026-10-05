// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId } from 'react';
import { ALL_EVENTS, generateSecret, MIN_SECRET_LENGTH, type SubscriptionDraft } from './webhookModel';

/**
 * A subscription's fields: where deliveries go, which events, whether it's on, and the secret they
 * are signed with. The secret is never shown again once saved, so a generated one is shown here
 * for the user to copy to the receiver.
 */
export function SubscriptionFields({
  draft,
  onChange,
  secretRequired,
}: {
  draft: SubscriptionDraft;
  onChange: (draft: SubscriptionDraft) => void;
  secretRequired: boolean;
}): ReactElement {
  const ids = { url: useId(), events: useId(), secret: useId(), active: useId() };
  const set = <K extends keyof SubscriptionDraft>(field: K, value: SubscriptionDraft[K]): void => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className='grid gap-3'>
      <div className='grid gap-1'>
        <Label htmlFor={ids.url}>Deliver to (URL)</Label>
        <Input
          id={ids.url}
          type='url'
          value={draft.target_url}
          placeholder='https://example.com/hooks'
          onChange={(event) => set('target_url', event.target.value)}
        />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.events}>Events</Label>
        <Input id={ids.events} value={draft.event_types} onChange={(event) => set('event_types', event.target.value)} />
        <p className='text-xs text-muted-foreground'>
          Event names separated by spaces or commas, or {ALL_EVENTS} for every event.
        </p>
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.secret}>{secretRequired ? 'Signing secret' : 'New signing secret (optional)'}</Label>
        <div className='flex gap-2'>
          <Input
            id={ids.secret}
            value={draft.secret}
            autoComplete='off'
            spellCheck={false}
            className='font-mono'
            onChange={(event) => set('secret', event.target.value)}
          />
          <Button type='button' variant='outline' onClick={() => set('secret', generateSecret())}>
            Generate
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          At least {MIN_SECRET_LENGTH} characters. Each delivery is signed with it (X-Webhook-Signature: sha256=…); copy it
          to the receiver now, as it is never shown again{secretRequired ? '' : '. Leave blank to keep the current one'}.
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <input
          id={ids.active}
          type='checkbox'
          checked={draft.active}
          onChange={(event) => set('active', event.target.checked)}
        />
        <Label htmlFor={ids.active}>Deliver events (uncheck to pause)</Label>
      </div>
    </div>
  );
}
