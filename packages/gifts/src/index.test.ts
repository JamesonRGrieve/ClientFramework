// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/gifts', () => {
  it('publishes the gift list, its reads and writes, the model, and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'GIFTS_PATH',
        'GIFT_ENDPOINT',
        'GiftSchema',
        'GiftsPage',
        'STATUSES',
        'giftsApi',
        'giftsExtension',
        'statusLabel',
        'useGifts',
        'useShopLink',
      ].sort(),
    );
  });
});
