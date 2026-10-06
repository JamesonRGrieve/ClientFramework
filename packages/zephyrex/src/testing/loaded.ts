// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { TestWrapper } from './TestWrapper';

/**
 * What a read `hook` loads under the Zephyrex test app, once it has loaded (null included): for
 * tests of SWR-backed hooks, one read at a time.
 */
export async function loaded<T>(hook: () => { data: T | undefined }): Promise<T> {
  const { result } = renderHook(hook, { wrapper: TestWrapper });
  let data: T | undefined;
  await waitFor(() => {
    data = result.current.data;
    if (data === undefined) {
      throw new Error('Not loaded yet');
    }
  });
  if (data === undefined) {
    throw new Error('The hook loaded nothing');
  }
  return data;
}
