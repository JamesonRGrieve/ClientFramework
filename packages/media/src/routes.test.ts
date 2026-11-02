// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { WATCH_LIST_PATH } from './routes';

describe('media routes', () => {
  it('mounts the watch-list at /watch-list', () => {
    expect(WATCH_LIST_PATH).toBe('/watch-list');
  });
});
