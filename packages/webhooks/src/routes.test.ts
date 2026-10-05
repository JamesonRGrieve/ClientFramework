// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { subscriptionPagePath, WEBHOOKS_PATH } from './routes';

describe('webhook routes', () => {
  it('puts each subscription under the webhooks page, its id escaped', () => {
    expect(WEBHOOKS_PATH).toBe('/webhooks');
    expect(subscriptionPagePath('s 1/2')).toBe('/webhooks/s%201%2F2');
  });
});
