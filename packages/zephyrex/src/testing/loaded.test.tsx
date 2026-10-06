// SPDX-License-Identifier: AGPL-3.0-or-later
import useSWR from 'swr';
import { describe, expect, it } from 'vitest';
import { loaded } from './loaded';

describe('loaded', () => {
  it('reads what a hook loads once it has loaded, null included', async () => {
    await expect(loaded(() => useSWR('answer', async () => Promise.resolve(42)))).resolves.toBe(42);
    await expect(loaded(() => useSWR('nothing', async () => Promise.resolve(null)))).resolves.toBeNull();
  });

  it('fails a hook that never loads', async () => {
    await expect(loaded(() => ({ data: undefined }))).rejects.toThrow('Not loaded yet');
  });
});
