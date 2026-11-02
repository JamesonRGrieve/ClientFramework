// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/media', () => {
  it('publishes the watch-list page, its reads and writes, the model, and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'MediaItemSchema',
        'PickSchema',
        'TitleSchema',
        'WATCH_LISTS_ENDPOINT',
        'WATCH_LIST_PATH',
        'WatchListPage',
        'WatchListSchema',
        'everyoneOn',
        'mediaExtension',
        'titleLabel',
        'useMediaSearch',
        'usePick',
        'useWatchListActions',
        'useWatchLists',
      ].sort(),
    );
  });
});
