// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useSyncExternalStore } from 'react';

// The value is read again on every render; nothing needs to hear about changes between renders.
const ignoreChanges = (): (() => void) => () => undefined;

/**
 * A value only the browser can read, such as a cookie or the page's origin. The server, and the
 * browser while hydrating, render `serverValue`; the browser then renders what `read` returns.
 * `read` must return the same value until the thing it reads changes, as a primitive does.
 */
export function useBrowserValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(ignoreChanges, read, () => serverValue);
}
