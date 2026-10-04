// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { type GuardedSave, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';
import { type HealthRow, newestFirst, type RecordType } from './records';

const EnvelopeSchema = z.looseObject({});

const recordPath = <T extends HealthRow>(type: RecordType<T>, id: string): string =>
  `${type.endpoint}/${encodeURIComponent(id)}`;

/** Every record of `type` the signed-in user has, newest first. */
export function useRecords<T extends HealthRow>(type: RecordType<T>): SWRResponse<T[], Error> {
  const client = useClient();
  return useSWR<T[], Error>(client.url(type.endpoint), async () =>
    (await client.list(type.endpoint, type.envelope, type.schema)).sort(newestFirst(type)),
  );
}

/** Records a new `type` row; resolves to what the server stored. */
export async function createRecord<T extends HealthRow>(
  client: ZephyrexClient,
  type: RecordType<T>,
  values: Partial<T>,
): Promise<T> {
  const answer = EnvelopeSchema.parse(await client.post(type.endpoint, { [type.single]: values }));
  return type.schema.parse(new Map(Object.entries(answer)).get(type.single));
}

export interface RecordActions<T> {
  /** `update.save(row, changes)`: change a record, guarded by the row it was opened on. */
  update: GuardedSave<T>;
  /** `remove.save(row, {})`: delete a record, guarded by it as seen. */
  remove: GuardedSave<T>;
}

/** The writes to `type`'s records, each refreshing them. */
export function useRecordActions<T extends HealthRow>(type: RecordType<T>): RecordActions<T> {
  const client = useClient();
  const { mutate: refresh } = useRecords(type);
  const update = useCallback(
    async (seen: T, changes: Partial<T>): Promise<void> => {
      await client.put(recordPath(type, seen.id), { [type.single]: changes }, seen);
      await refresh();
    },
    [client, type, refresh],
  );
  const remove = useCallback(
    async (seen: T): Promise<void> => {
      await client.delete(recordPath(type, seen.id), seen);
      await refresh();
    },
    [client, type, refresh],
  );
  return { update: useGuardedSave(update, type.schema), remove: useGuardedSave(remove, type.schema) };
}
