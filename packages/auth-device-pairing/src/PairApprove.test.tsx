// SPDX-License-Identifier: AGPL-3.0-or-later
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithAuthentication, TEST_AUTH_SERVER as SERVER } from './authentication.mocks';
import { PairApprove } from './PairApprove';

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const APPROVE = 'Approve sign-in';

const renderAt = (search: string): RenderResult => {
  window.history.replaceState(null, '', `/user/pair/approve${search}`);
  return renderWithAuthentication(<PairApprove />);
};

const serve = (status: number, body: object): ReturnType<typeof vi.fn> => {
  const fetchMock = vi.fn(async () => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('PairApprove', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('approves the other device only when asked, with the token from the code', async () => {
    const fetchMock = serve(HTTP_OK, { pairing_id: 'p1', state: 'approved', user_id: 'u1' });
    const user = userEvent.setup();
    const view = renderAt('?token=pair-1');
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(view.getByRole('button', { name: APPROVE }));
    expect(await view.findByRole('status')).toHaveTextContent('being signed in');
    expect(fetchMock).toHaveBeenCalledWith(
      `${SERVER}/v1/auth/pairing/approve`,
      expect.objectContaining({ method: 'POST', body: '{"token":"pair-1"}' }),
    );
  });

  it('denies it', async () => {
    const fetchMock = serve(HTTP_OK, { pairing_id: 'p1', state: 'denied' });
    const user = userEvent.setup();
    const view = renderAt('?token=pair-1');
    await user.click(view.getByRole('button', { name: 'Deny' }));
    expect(await view.findByRole('status')).toHaveTextContent('stays signed out');
    expect(fetchMock).toHaveBeenCalledWith(`${SERVER}/v1/auth/pairing/deny`, expect.anything());
  });

  it('says why an answer was refused', async () => {
    serve(HTTP_UNAUTHORIZED, { detail: 'Invalid or expired pairing token' });
    const user = userEvent.setup();
    const view = renderAt('?token=old');
    await user.click(view.getByRole('button', { name: APPROVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Invalid or expired pairing token');
  });

  it('refuses a link without a token', () => {
    const view = renderAt('');
    expect(view.getByRole('alert')).toHaveTextContent('This pairing link is incomplete.');
    expect(view.queryByRole('button', { name: APPROVE })).toBeNull();
  });
});
