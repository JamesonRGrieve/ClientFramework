// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type KeyedMutator } from 'swr';
import { z } from 'zod';
import { useClient } from '../../../hooks';
import { type ProfileChanges, type UserProfile, UserProfileResponseSchema } from './profileModel';

export const PROFILE_ENDPOINT = '/v1/user';

const PasswordChangeResponseSchema = z.object({ message: z.string() });

export interface ProfileState {
  profile: UserProfile | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: KeyedMutator<UserProfile>;
  /** PUT only the changed fields; resolves with the saved profile. */
  update: (changes: ProfileChanges) => Promise<UserProfile>;
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

  const update = useCallback(
    async (changes: ProfileChanges): Promise<UserProfile> => {
      const { user } = UserProfileResponseSchema.parse(await client.put(PROFILE_ENDPOINT, { user: changes }));
      await mutate(user, { revalidate: false });
      return user;
    },
    [client, mutate],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<string> =>
      PasswordChangeResponseSchema.parse(
        await client.patch(PROFILE_ENDPOINT, { current_password: currentPassword, new_password: newPassword }),
      ).message,
    [client],
  );

  return { profile: data, error, isLoading, mutate, update, changePassword };
}
