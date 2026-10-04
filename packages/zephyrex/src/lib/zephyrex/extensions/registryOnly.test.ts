// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { kerberosConsumerExtension, oauthProviderExtension, registryOnlyExtensions } from './registryOnly';

describe('registryOnlyExtensions', () => {
  it('each pairs with its server extension by name, named and described, with no client code yet', () => {
    expect(registryOnlyExtensions).toHaveLength(30);
    for (const extension of registryOnlyExtensions) {
      expect(extension.serverExtension).toBe(extension.name);
      expect(extension.displayName).not.toBe('');
      expect(extension.description).not.toBe('');
      expect(extension.pages).toBeUndefined();
      expect(extension.managementTabs).toBeUndefined();
      expect(extension.authPages).toBeUndefined();
    }
  });

  it('names an identity protocol by its role: signing in through it, or this server as one', () => {
    expect(kerberosConsumerExtension).toMatchObject({ name: 'kerberos_consumer', displayName: 'Kerberos sign-in' });
    expect(oauthProviderExtension).toMatchObject({ name: 'oauth_provider', displayName: 'OAuth provider' });
  });
});
