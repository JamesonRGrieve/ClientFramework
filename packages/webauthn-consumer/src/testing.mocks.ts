// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's test helpers (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { type Call, recordingFetch } from 'zephyrex/testing/msw';
import { credentialHandlers, credentialsFixture, type CredentialStore } from './credentials.mocks';

/** Answers every request from the credential routes over `store`, recording each into the list returned. */
export function recordCalls(store: CredentialStore): Call[] {
  const recorded = recordingFetch(credentialHandlers(store));
  vi.stubGlobal('fetch', vi.fn(recorded.fetch));
  return recorded.calls;
}

/** Renders `ui` under the Zephyrex test app, its requests answered by the credential routes over `store`. */
export function renderPasskeys(ui: ReactElement, store: CredentialStore = credentialsFixture()): RenderResult {
  recordCalls(store);
  return render(createElement(TestWrapper, null, ui));
}

/** A credential a fake authenticator hands back: its JSON is fixed. */
class FakeCredential {
  static parseCreationOptionsFromJSON<T>(options: T): T {
    return options;
  }

  static parseRequestOptionsFromJSON<T>(options: T): T {
    return options;
  }

  toJSON(): Record<string, string> {
    return { id: 'bmV3', rawId: 'bmV3', type: 'public-key' };
  }
}

/**
 * A browser that registers passkeys (jsdom has none): navigator.credentials.create answers with a
 * credential, or rejects with `refusal`. Undone by vi.unstubAllGlobals and `restore`.
 */
export function fakeAuthenticator(refusal?: DOMException): { create: ReturnType<typeof vi.fn>; restore: () => void } {
  const create = vi.fn(async () =>
    refusal === undefined ? Promise.resolve(new FakeCredential()) : Promise.reject(refusal),
  );
  vi.stubGlobal('PublicKeyCredential', FakeCredential);
  Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create } });
  return {
    create,
    restore: (): void => {
      Reflect.deleteProperty(navigator, 'credentials');
    },
  };
}
