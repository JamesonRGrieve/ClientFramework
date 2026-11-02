// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/payment', () => {
  it('publishes the subscribe page, the extension that mounts it, and the Square checkout', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'STRIPE_PRICING_TABLE_SCRIPT',
        'Subscribe',
        'paymentExtension',
        'SquareCheckout',
        'formatPrice',
        'loadSquareSdk',
        'squareCspAdditions',
        'squareScript',
      ].sort(),
    );
  });
});
