// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { type Session, sessionLabel, Sessions, SESSIONS_ENDPOINT } from './Sessions';

const ENDPOINT = `${testConfig.server.baseUrl}${SESSIONS_ENDPOINT}`;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_FORBIDDEN = 403;

const session = (id: string, overrides: Partial<Session> = {}): Session => ({
  id,
  browser: 'Firefox',
  device_type: 'desktop',
  is_active: true,
  revoked: false,
  last_activity: '2026-09-29T12:00:00Z',
  expires_at: '2026-10-29T12:00:00Z',
  ...overrides,
});

const renderSessions = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <Sessions />
    </TestWrapper>,
  );

describe('sessionLabel', () => {
  it('names a session by browser and device', () => {
    expect(sessionLabel(session('s1', { device_name: 'Ada’s laptop' }))).toBe('Firefox on Ada’s laptop');
    expect(sessionLabel(session('s1'))).toBe('Firefox on desktop');
    expect(sessionLabel(session('s1', { browser: null, device_type: null }))).toBe('Unknown device');
  });
});

describe('Sessions', () => {
  let rows: Session[];
  let revokeStatus: number;

  beforeEach(() => {
    rows = [session('s1'), session('s2', { browser: 'Safari', device_type: 'mobile' }), session('s3', { revoked: true })];
    revokeStatus = HTTP_NO_CONTENT;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          if (revokeStatus !== HTTP_NO_CONTENT) {
            return Promise.resolve(
              new Response('{"detail":"Cannot revoke another user\'s session"}', { status: revokeStatus }),
            );
          }
          rows = rows.filter((row) => !input.endsWith(`/${row.id}`));
          return Promise.resolve(new Response(null, { status: HTTP_NO_CONTENT }));
        }
        // The session list; the rest of the app shell's requests get an empty object.
        return Promise.resolve(
          new Response(
            JSON.stringify(input.startsWith(`${ENDPOINT}?`) ? { sessions: rows, pagination: { has_more: false } } : {}),
            { status: HTTP_OK },
          ),
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the active sessions only', async () => {
    const view = renderSessions();
    const list = await view.findByRole('list', { name: 'Active sessions' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Safari on mobile')).toBeInTheDocument();
  });

  it('signs a session out', async () => {
    const user = userEvent.setup();
    const view = renderSessions();
    await user.click(await view.findByRole('button', { name: 'Sign out Safari on mobile' }));
    await vi.waitFor(() => {
      expect(view.queryByText('Safari on mobile')).toBeNull();
    });
  });

  it('says why a session could not be signed out', async () => {
    revokeStatus = HTTP_FORBIDDEN;
    const user = userEvent.setup();
    const view = renderSessions();
    await user.click(await view.findByRole('button', { name: 'Sign out Firefox on desktop' }));
    expect(await view.findByRole('alert')).toHaveTextContent("Cannot revoke another user's session");
  });
});
