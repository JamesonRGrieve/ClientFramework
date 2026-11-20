// SPDX-License-Identifier: AGPL-3.0-or-later
import { timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server.js';
import { describe, expect, it, vi } from 'vitest';
import {
  type AccountStore,
  accountRoutes,
  accountsOwner,
  hashPassword,
  type LocalAccount,
  SESSION_COOKIE,
  secureCompare,
  sessionAccount,
  sessionToken,
  verifyPassword,
} from './accounts';

const SECRET = 'a'.repeat(40);
const PASSWORD = 'longenough';
const HORSE = 'correct horse';
const ACCOUNT_PATH = '/api/v1/account';
const SIGN_IN_PATH = '/api/v1/sign_in';
const CHAT_PATH = '/api/v1/chat';
const SET_COOKIE = 'set-cookie';

/** An in-memory AccountStore; each method settles a tick first, as a real store's I/O would. */
function memoryStore(): AccountStore & { rows: LocalAccount[] } {
  const rows: LocalAccount[] = [];
  return {
    rows,
    count: async (): Promise<number> => {
      await Promise.resolve();
      return rows.length;
    },
    findByName: async (name): Promise<LocalAccount | null> => {
      await Promise.resolve();
      return rows.find((row) => row.name === name) ?? null;
    },
    findById: async (id): Promise<LocalAccount | null> => {
      await Promise.resolve();
      return rows.find((row) => row.id === id) ?? null;
    },
    create: async (account): Promise<LocalAccount> => {
      await Promise.resolve();
      const row = { ...account, id: `acc-${rows.length + 1}` };
      rows.push(row);
      return row;
    },
  };
}

function post(path: string, body: object, cookie?: string): NextRequest {
  return new NextRequest(`http://lite.local${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie === undefined ? {} : { Cookie: cookie }) },
    body: JSON.stringify(body),
  });
}

const cookieOf = (response: Response): string => (response.headers.get(SET_COOKIE) ?? '').split(';')[0] ?? '';

describe('passwords', () => {
  it('verifies the password a hash was made from, and nothing else', async () => {
    const stored = await hashPassword(HORSE);
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword(HORSE, stored)).toBe(true);
    expect(await verifyPassword('correct house', stored)).toBe(false);
    expect(await verifyPassword('x', 'not a hash')).toBe(false);
  });
});

describe('sessions', () => {
  it('names the account until it expires, and only with its own signature', () => {
    const token = sessionToken('acc-1', 2000, SECRET);
    expect(sessionAccount(token, SECRET, 1000)).toBe('acc-1');
    expect(sessionAccount(token, SECRET, 3000)).toBeNull();
    expect(sessionAccount(token, 'b'.repeat(40), 1000)).toBeNull();
    expect(sessionAccount(token.replace('acc-1', 'acc-2'), SECRET, 1000)).toBeNull();
  });
});

describe('tampering and timing', () => {
  it('refuses a tampered, truncated or re-signed cookie, and an expired one', () => {
    const now = 1000;
    const token = sessionToken('acc-1', 2000, SECRET);
    const [id, expires, signature] = token.split('.') as [string, string, string];
    const flipped = `${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`;
    expect(sessionAccount(`${id}.${expires}.${flipped}`, SECRET, now)).toBeNull();
    expect(sessionAccount(`${id}.9999999999.${signature}`, SECRET, now)).toBeNull();
    expect(sessionAccount(`${id}.${expires}.${signature.slice(0, 8)}`, SECRET, now)).toBeNull();
    expect(sessionAccount(`${id}.${expires}`, SECRET, now)).toBeNull();
    expect(sessionAccount('', SECRET, now)).toBeNull();
    expect(sessionAccount(sessionToken('acc-1', 999, SECRET), SECRET, now)).toBeNull();
  });

  it('compares signatures and password keys in constant time', async () => {
    // The comparison is Node's own constant-time one, and every secret comparison goes through it.
    expect(secureCompare.equal).toBe(timingSafeEqual);
    const compare = vi.spyOn(secureCompare, 'equal');
    sessionAccount(sessionToken('acc-1', 2000, SECRET), SECRET, 1000);
    expect(compare).toHaveBeenCalledTimes(1);
    compare.mockClear();
    await verifyPassword(HORSE, await hashPassword(HORSE));
    expect(compare).toHaveBeenCalledTimes(1);
    compare.mockRestore();
  });

  it('refuses a request whose cookie was signed with another install’s secret', async () => {
    const store = memoryStore();
    const owner = accountsOwner(store, SECRET);
    await store.create({ name: 'Ana', passwordHash: await hashPassword(PASSWORD), isAdmin: true });
    const forged = `${SESSION_COOKIE}=${sessionToken('acc-1', Math.floor(Date.now() / 1000) + 60, 'b'.repeat(40))}`;
    await expect(owner(post(CHAT_PATH, {}, forged))).rejects.toMatchObject({ status: 401 });
  });
});

describe('accountRoutes and accountsOwner', () => {
  it('makes the first account the admin and signs it in; then only the admin adds people', async () => {
    const store = memoryStore();
    const routes = accountRoutes(store, SECRET);
    const first = await routes.create(post(ACCOUNT_PATH, { account: { name: 'Ana', password: PASSWORD } }));
    expect(first.status).toBe(201);
    expect(await first.json()).toEqual({ account: { id: 'acc-1', name: 'Ana', is_admin: true } });
    const admin = cookieOf(first);
    expect(admin.startsWith(`${SESSION_COOKIE}=`)).toBe(true);

    const stranger = await routes.create(post(ACCOUNT_PATH, { account: { name: 'Bo', password: PASSWORD } }));
    expect(stranger.status).toBe(401);
    const added = await routes.create(post(ACCOUNT_PATH, { account: { name: 'Bo', password: PASSWORD } }, admin));
    expect(added.status).toBe(201);
    expect(added.headers.get(SET_COOKIE)).toBeNull();

    const signedIn = await routes.signIn(post(SIGN_IN_PATH, { sign_in: { name: 'Bo', password: PASSWORD } }));
    const bo = cookieOf(signedIn);
    const byBo = await routes.create(post(ACCOUNT_PATH, { account: { name: 'Cy', password: PASSWORD } }, bo));
    expect(byBo.status).toBe(403);
    const taken = await routes.create(post(ACCOUNT_PATH, { account: { name: 'Bo', password: PASSWORD } }, admin));
    expect(taken.status).toBe(422);
  });

  it('refuses a wrong password the same way as an unknown name', async () => {
    const store = memoryStore();
    const routes = accountRoutes(store, SECRET);
    await routes.create(post(ACCOUNT_PATH, { account: { name: 'Ana', password: PASSWORD } }));
    const wrong = await routes.signIn(post(SIGN_IN_PATH, { sign_in: { name: 'Ana', password: 'wrongwrong' } }));
    const unknown = await routes.signIn(post(SIGN_IN_PATH, { sign_in: { name: 'Zed', password: PASSWORD } }));
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
    expect((await routes.signIn(post(SIGN_IN_PATH, { sign_in: { name: 'Ana', password: 'short' } }))).status).toBe(422);
  });

  it('owns a request by its session, and refuses one with none or a cross-site write', async () => {
    const store = memoryStore();
    const routes = accountRoutes(store, SECRET);
    const owner = accountsOwner(store, SECRET);
    const cookie = cookieOf(await routes.create(post(ACCOUNT_PATH, { account: { name: 'Ana', password: PASSWORD } })));
    expect(await owner(post(CHAT_PATH, {}, cookie))).toEqual({ id: 'acc-1' });
    await expect(owner(post(CHAT_PATH, {}))).rejects.toMatchObject({ status: 401 });
    const crossSite = new NextRequest('http://lite.local/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site', Cookie: cookie },
      body: '{}',
    });
    await expect(owner(crossSite)).rejects.toMatchObject({ status: 403 });
    const out = routes.signOut(post('/api/v1/sign_out', {}, cookie));
    expect(out.headers.get(SET_COOKIE)).toContain('Max-Age=0');
  });

  it('refuses a short secret', () => {
    expect(() => accountsOwner(memoryStore(), 'short')).toThrow('at least 32');
  });
});
