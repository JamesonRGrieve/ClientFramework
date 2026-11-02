// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { GiftSchema, STATUSES, statusLabel } from './giftsModel';

describe('the gifts model', () => {
  it('names each status', () => {
    expect(STATUSES.map(statusLabel)).toEqual(['Idea', 'Bought', 'Given']);
  });

  it('reads a gift without a link or note', () => {
    const gift = GiftSchema.parse({ id: 'g', for_name: 'Alex', title: 'Scarf', status: 'idea' });
    expect(gift.url).toBeUndefined();
  });

  it('refuses a status the server does not have', () => {
    expect(() => GiftSchema.parse({ id: 'g', for_name: 'Alex', title: 'Scarf', status: 'lost' })).toThrow();
  });
});
