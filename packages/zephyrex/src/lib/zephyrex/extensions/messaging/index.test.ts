// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { messagingExtension } from './index';

describe('messagingExtension', () => {
  it("pairs with the server's messaging extension, with no client pages of its own", () => {
    expect(messagingExtension).toMatchObject({ name: 'messaging', serverExtension: 'messaging', displayName: 'Messaging' });
    expect(messagingExtension.pages).toBeUndefined();
  });
});
