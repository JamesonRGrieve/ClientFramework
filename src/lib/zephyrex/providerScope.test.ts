// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  EMPTY_SELECTION,
  type ProviderInstance,
  providerLabel,
  providersInExtension,
  scopeProviderInstances,
  selectExtension,
} from './providerScope';

const OPENAI = 'p-openai';
const ANTHROPIC = 'p-anthropic';
const SMTP = 'p-smtp';
const AI_EXTENSION = 'x-ai';
const EMAIL = 'x-email';

const providers = [
  { id: OPENAI, name: 'openai', friendly_name: 'OpenAI' },
  { id: ANTHROPIC, name: 'anthropic', friendly_name: null },
  { id: SMTP, name: 'smtp' },
];

const links = [
  { provider_id: OPENAI, extension_id: AI_EXTENSION },
  { provider_id: ANTHROPIC, extension_id: AI_EXTENSION },
  { provider_id: SMTP, extension_id: EMAIL },
];

const instance = (id: string, providerId: string): ProviderInstance => ({
  id,
  name: id,
  provider_id: providerId,
  created_at: '2026-09-01T00:00:00Z',
});
const instances = [instance('i-gpt', OPENAI), instance('i-claude', ANTHROPIC), instance('i-mail', SMTP)];
const catalog = { providers, links, instances };

const ids = (items: readonly { id: string }[]): string[] => items.map((item) => item.id);

describe('providersInExtension', () => {
  it('keeps only providers linked to the extension', () => {
    expect(ids(providersInExtension(providers, links, AI_EXTENSION))).toEqual([OPENAI, ANTHROPIC]);
  });

  it('keeps every provider when no extension is chosen', () => {
    expect(ids(providersInExtension(providers, links, null))).toEqual([OPENAI, ANTHROPIC, SMTP]);
  });

  it('keeps none for an extension no provider supports', () => {
    expect(providersInExtension(providers, links, 'x-none')).toEqual([]);
  });
});

describe('scopeProviderInstances', () => {
  it('shows everything when nothing is chosen', () => {
    const scoped = scopeProviderInstances(catalog, EMPTY_SELECTION);
    expect(ids(scoped.providers)).toEqual([OPENAI, ANTHROPIC, SMTP]);
    expect(ids(scoped.instances)).toEqual(['i-gpt', 'i-claude', 'i-mail']);
  });

  it('scopes instances to the extension’s providers', () => {
    const scoped = scopeProviderInstances(catalog, { extensionId: AI_EXTENSION, providerId: null });
    expect(ids(scoped.providers)).toEqual([OPENAI, ANTHROPIC]);
    expect(ids(scoped.instances)).toEqual(['i-gpt', 'i-claude']);
  });

  it('then to the chosen provider', () => {
    const scoped = scopeProviderInstances(catalog, { extensionId: AI_EXTENSION, providerId: ANTHROPIC });
    expect(ids(scoped.instances)).toEqual(['i-claude']);
  });

  it('selects nothing for a provider outside the extension', () => {
    expect(scopeProviderInstances(catalog, { extensionId: AI_EXTENSION, providerId: SMTP }).instances).toEqual([]);
  });
});

describe('selectExtension', () => {
  it('keeps the chosen provider while the new extension allows it', () => {
    expect(selectExtension({ extensionId: null, providerId: OPENAI }, AI_EXTENSION, providers, links)).toEqual({
      extensionId: AI_EXTENSION,
      providerId: OPENAI,
    });
  });

  it('drops a provider the new extension does not allow', () => {
    expect(selectExtension({ extensionId: AI_EXTENSION, providerId: OPENAI }, EMAIL, providers, links)).toEqual({
      extensionId: EMAIL,
      providerId: null,
    });
  });
});

describe('providerLabel', () => {
  it('prefers the friendly name and falls back to the name', () => {
    expect(providers.map(providerLabel)).toEqual(['OpenAI', 'anthropic', 'smtp']);
  });
});
