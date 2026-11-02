// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { emptyGiftsStore, giftsFixture } from './gifts.mocks';

describe('the gifts mock', () => {
  it('holds an idea and a bought gift', () => {
    expect(giftsFixture().gifts.map((gift) => gift.status)).toEqual(['idea', 'bought']);
  });

  it('starts empty when asked', () => {
    expect(emptyGiftsStore().gifts).toEqual([]);
  });
});
