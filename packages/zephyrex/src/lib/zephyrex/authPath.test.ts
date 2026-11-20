// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { accountsEnabled, sidebarShownOn } from './authPath';

describe('accountsEnabled', () => {
  it('is on unless the app turns accounts off', () => {
    expect(accountsEnabled({})).toBe(true);
    expect(accountsEnabled({ auth: {} })).toBe(true);
    expect(accountsEnabled({ auth: { enabled: true } })).toBe(true);
    expect(accountsEnabled({ auth: { enabled: false } })).toBe(false);
  });
});

describe('sidebarShownOn', () => {
  it('hides the sidebar on the landing page and the sign-in pages, but not the account page', () => {
    expect(sidebarShownOn('/', '/user')).toBe(false);
    expect(sidebarShownOn('/user', '/user')).toBe(false);
    expect(sidebarShownOn('/user/login', '/user')).toBe(false);
    expect(sidebarShownOn('/user/manage', '/user')).toBe(true);
    expect(sidebarShownOn('/tasks', '/user')).toBe(true);
  });
});
