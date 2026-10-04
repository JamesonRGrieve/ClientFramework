// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type KeyedMutator } from 'swr';
import { z } from 'zod';
import { StaleWriteError } from '../../../client';
import { useClient } from '../../../hooks';
import { type Conflict, useGuardedSave } from '../../../useGuardedSave';
import { type ProfileChanges, type UserProfile, UserProfileResponseSchema, UserProfileSchema } from './profileModel';

export const PROFILE_ENDPOINT = '/v1/user';

const PasswordChangeResponseSchema = z.object({ message: z.string() });

export interface ProfileState {
  profile: UserProfile | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: KeyedMutator<UserProfile>;
  /**
   * PUT only the changed fields, guarded by `seen`, the profile the form was filled from: true
   * once saved, false when someone changed it first (see `conflict`).
   */
  update: (seen: UserProfile, changes: ProfileChanges) => Promise<boolean>;
  /** An update refused because the profile changed first, until resolved or discarded. */
  conflict: Conflict<UserProfile> | null;
  resolve: (merged: Partial<UserProfile>) => Promise<boolean>;
  discard: () => void;
  /** PATCH the password; resolves with the server's confirmation. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
}

/** The signed-in user's own profile, with the self-service writes the server allows. */
export function useProfile(): ProfileState {
  const client = useClient();
  const { data, error, isLoading, mutate } = useSWR<UserProfile, Error>(
    client.url(PROFILE_ENDPOINT),
    async () => UserProfileResponseSchema.parse(await client.get(PROFILE_ENDPOINT)).user,
  );

  const write = useCallback(
    async (seen: UserProfile, changes: Partial<UserProfile>): Promise<void> => {
      const { user } = UserProfileResponseSchema.parse(await client.put(PROFILE_ENDPOINT, { user: changes }, seen));
      await mutate(user, { revalidate: false });
    },
    [client, mutate],
  );
  const { save: update, conflict, resolve, discard } = useGuardedSave(write, UserProfileSchema);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<string> => {
      if (data === undefined) {
        throw new Error('The profile has not loaded yet.');
      }
      try {
        return PasswordChangeResponseSchema.parse(
          await client.patch(PROFILE_ENDPOINT, { current_password: currentPassword, new_password: newPassword }, data),
        ).message;
      } catch (failure) {
        if (!(failure instanceof StaleWriteError)) {
          throw failure;
        }
        // The account changed elsewhere first: show it as it is now, and let the user try again.
        await (failure.current === null
          ? mutate()
          : mutate(UserProfileSchema.parse(failure.current), { revalidate: false }));
        throw new Error('Your account changed since this page loaded. It has been refreshed; change your password again.', {
          cause: failure,
        });
      }
    },
    [client, data, mutate],
  );

  return { profile: data, error, isLoading, mutate, update, conflict, resolve, discard, changePassword };
}
