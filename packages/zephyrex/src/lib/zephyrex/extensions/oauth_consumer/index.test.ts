// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { oauthConsumerExtension } from './index';

describe('oauthConsumerExtension', () => {
  it('pairs with oauth_consumer and holds the linked accounts as a management tab', () => {
    expect(oauthConsumerExtension).toMatchObject({ name: 'oauth_consumer', serverExtension: 'oauth_consumer' });
    expect(oauthConsumerExtension.managementTabs?.map(({ id, label }) => [id, label])).toEqual([
      ['connected-accounts', 'Connected Accounts'],
    ]);
  });
});
