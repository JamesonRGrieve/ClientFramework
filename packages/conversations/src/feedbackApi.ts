// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { type GuardedSave, useClient, useGuardedSave, useUser, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const FEEDBACK_ENDPOINT = '/v1/feedback';

const optionalText = z.string().nullable().optional();

/** A user's rating of a message, for judging (and training) the agent that wrote it. Only its author changes it. */
export const FeedbackSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  user_id: optionalText,
  /** The user's note; the rating alone is sent with none. */
  content: z.string(),
  /** Helpful (true), not helpful (false), or neither (null). */
  positive: z.boolean().nullable().optional(),
  created_at: optionalText,
  updated_at: optionalText,
});
export type Feedback = z.infer<typeof FeedbackSchema>;

const feedbackPath = (id: string): string => `${FEEDBACK_ENDPOINT}/${encodeURIComponent(id)}`;

/** The feedback the signed-in user has given, on any message; nothing is asked before they are known. */
export function useMyFeedback(): SWRResponse<Feedback[], Error> {
  const client = useClient();
  const { data: user } = useUser();
  const params = { user_id: user?.id ?? '' };
  return useSWR<Feedback[], Error>(user === undefined ? null : client.url(FEEDBACK_ENDPOINT, params), async () =>
    client.list(FEEDBACK_ENDPOINT, 'feedbacks', FeedbackSchema, params),
  );
}

/** Rates a message as the user, with no note. */
export async function rateMessage(client: ZephyrexClient, messageId: string, positive: boolean): Promise<void> {
  await client.post(FEEDBACK_ENDPOINT, { feedback: { message_id: messageId, content: '', positive } });
}

export interface FeedbackActions {
  /** `update.save(feedback, { positive })`: change the user's rating, guarded by it as loaded. */
  update: GuardedSave<Feedback>;
  /** `remove.save(feedback, {})`: withdraw it, guarded by it as loaded. */
  remove: GuardedSave<Feedback>;
}

/** The writes to the user's own feedback, each refreshing it. */
export function useFeedbackActions(): FeedbackActions {
  const client = useClient();
  const { mutate: refreshFeedback } = useMyFeedback();
  const update = useCallback(
    async (seen: Feedback, changes: Partial<Feedback>): Promise<void> => {
      await client.put(feedbackPath(seen.id), { feedback: { positive: changes.positive } }, seen);
      await refreshFeedback();
    },
    [client, refreshFeedback],
  );
  const remove = useCallback(
    async (seen: Feedback): Promise<void> => {
      await client.delete(feedbackPath(seen.id), seen);
      await refreshFeedback();
    },
    [client, refreshFeedback],
  );
  return { update: useGuardedSave(update, FeedbackSchema), remove: useGuardedSave(remove, FeedbackSchema) };
}
