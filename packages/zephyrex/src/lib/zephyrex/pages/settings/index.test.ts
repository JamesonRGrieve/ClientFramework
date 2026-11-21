// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it, vi } from 'vitest';
import * as settings from './index';

vi.mock('next/headers.js', () => ({
  cookies: async (): Promise<{ get: () => undefined }> => Promise.resolve({ get: () => undefined }),
}));

describe('zephyrex/pages/settings', () => {
  it('publishes the settings page and its body', () => {
    expect(Object.keys(settings).sort()).toEqual(['ThemeSettings', 'ThemeSettingsPage']);
  });
});
