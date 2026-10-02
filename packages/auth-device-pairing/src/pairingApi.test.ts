// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerPairing, pairingStatus, requestPairing } from './pairingApi';

const SERVER = 'https://app.example.com/api';
const HTTP_OK = 200;
/** Session requests send the cookie to the app's own origin. */
const SAME_ORIGIN = 'same-origin';

describe('answerPairing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the decision with the token on the session cookie', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(new Response('{"pairing_id":"p1","state":"approved","user_id":"u1"}', { status: HTTP_OK })),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(answerPairing(SERVER, 'pair-1', 'approve')).resolves.toEqual({ pairing_id: 'p1', state: 'approved' });
    expect(fetchMock).toHaveBeenCalledWith(
      `${SERVER}/v1/auth/pairing/approve`,
      expect.objectContaining({ method: 'POST', credentials: SAME_ORIGIN, body: '{"token":"pair-1"}' }),
    );
  });

  it('rejects an answer in an unexpected state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{"pairing_id":"p1","state":"pending"}', { status: HTTP_OK }))),
    );
    await expect(answerPairing(SERVER, 'pair-1', 'deny')).rejects.toThrow();
  });
});

describe('requestPairing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks as a web device, leaving the binding in the cookie the server sets', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(
        new Response(
          '{"pairing_id":"p1","qr_payload":"https://app.example.com/user/pair/approve?token=t","expires_in":300}',
          {
            status: HTTP_OK,
          },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestPairing(SERVER)).resolves.toEqual({
      pairing_id: 'p1',
      qr_payload: 'https://app.example.com/user/pair/approve?token=t',
      expires_in: 300,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${SERVER}/v1/auth/pairing/request`,
      expect.objectContaining({ method: 'POST', credentials: SAME_ORIGIN, body: '{"requesting_device_type":"web"}' }),
    );
  });
});

describe('pairingStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the state, with the binding cookie riding along', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(new Response('{"pairing_id":"p 1","state":"approved","user_id":"u1"}', { status: HTTP_OK })),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(pairingStatus(SERVER, 'p 1')).resolves.toBe('approved');
    expect(fetchMock).toHaveBeenCalledWith(
      `${SERVER}/v1/auth/pairing/p%201/status`,
      expect.objectContaining({ credentials: SAME_ORIGIN }),
    );
  });
});
