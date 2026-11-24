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
    // Visitor pages: the waitlist every app has, and an app's own.
    expect(sidebarShownOn('/waitlist', '/user')).toBe(false);
    expect(sidebarShownOn('/waitlist/thanks', '/user')).toBe(false);
    expect(sidebarShownOn('/waitlisted', '/user')).toBe(true);
    expect(sidebarShownOn('/pricing', '/user')).toBe(true);
    expect(sidebarShownOn('/pricing', '/user', ['/pricing'])).toBe(false);
    // Outside the app router usePathname answers null: no sidebar, and no throw.
    expect(sidebarShownOn(null, '/user')).toBe(false);
  });
});
