// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { smsExtension } from './index';

describe('smsExtension', () => {
  it("pairs with the server's sms extension, with no client pages of its own", () => {
    expect(smsExtension).toMatchObject({ name: 'sms', serverExtension: 'sms', displayName: 'SMS' });
    expect(smsExtension.pages).toBeUndefined();
  });
});
