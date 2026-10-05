// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, writeProblem } from 'zephyrex';
import { type Feedback, rateMessage, useFeedbackActions, useMyFeedback } from './feedbackApi';
import { Problem } from './Problem';

const RATING_FAILURE = 'Your rating could not be saved.';

/** A rating as the user said it. */
export const ratingLabel = (positive: boolean | null | undefined): string =>
  positive === true ? 'Helpful' : positive === false ? 'Not helpful' : 'No rating';

const CONFLICT_FIELDS: readonly ConflictField<Feedback>[] = [
  { key: 'positive', label: 'Rating', format: ({ positive }) => ratingLabel(positive) },
];

/**
 * Rate an agent's message helpful or not. Choosing the other rating changes it; choosing the one
 * given withdraws it. Each change is held to the rating as it was loaded.
 */
export function MessageFeedback({ messageId }: { messageId: string }): ReactElement {
  const client = useClient();
  const { data: given = [], mutate: refreshFeedback } = useMyFeedback();
  const { update, remove } = useFeedbackActions();
  const [problem, setProblem] = useState<string | null>(null);
  const mine = given.find(({ message_id: id }) => id === messageId);

  const settle = async (rating: Promise<boolean | undefined>): Promise<void> => {
    setProblem(await writeProblem(rating, RATING_FAILURE));
  };
  const rate = (positive: boolean): void => {
    setProblem(null);
    if (mine === undefined) {
      void settle(
        (async (): Promise<undefined> => {
          await rateMessage(client, messageId, positive);
          await refreshFeedback();
          return undefined;
        })(),
      );
    } else if (mine.positive === positive) {
      void settle(remove.save(mine, {}));
    } else {
      void settle(update.save(mine, { positive }));
    }
  };

  return (
    <div className='grid gap-1'>
      <fieldset className='flex gap-1'>
        <legend className='sr-only'>Rate this reply</legend>
        {[true, false].map((positive) => (
          <Button
            key={String(positive)}
            type='button'
            size='sm'
            variant={mine?.positive === positive ? 'secondary' : 'ghost'}
            aria-pressed={mine?.positive === positive}
            onClick={() => rate(positive)}
          >
            {ratingLabel(positive)}
          </Button>
        ))}
      </fieldset>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={CONFLICT_FIELDS}
          onResolve={(merged) => {
            void settle(update.resolve(merged));
          }}
          onDiscard={update.discard}
        />
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Withdraw anyway'
          onResolve={(merged) => {
            void settle(remove.resolve(merged));
          }}
          onDiscard={remove.discard}
        />
      )}
      <Problem text={problem} />
    </div>
  );
}
