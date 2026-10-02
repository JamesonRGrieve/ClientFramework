// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/payment', () => {
  it('publishes the subscribe page and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(['STRIPE_PRICING_TABLE_SCRIPT', 'Subscribe', 'paymentExtension'].sort());
  });
});
