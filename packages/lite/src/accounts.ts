// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Local accounts for a lite app shared by a household or a table (rpg-ai A50, vtt V30): each
 * person signs in with a name and a password, and every record is theirs. The first account made
 * is the admin; after that only an admin makes accounts. There are no emails and no recovery: it
 * is run on a network the people trust, as `localOwner` is.
 *
 * Nothing is added to install: passwords are hashed with Node's scrypt, and a session is a cookie
 * signed with the install's secret (HMAC-SHA256), so there is no session table. The app keeps the
 * accounts in its own store (`AccountStore`, e.g. a Prisma model).
 */
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server.js';
import { ApiError, apiErrorResponse, validationError } from './apiErrors';
import { refuseCrossSiteWrite } from './localOwner';
import type { Owner, OwnerResolver } from './records';
import { readJsonObject, requiredString } from './requestBody';
import { STATUS } from './status';

export interface LocalAccount {
  id: string;
  name: string;
  passwordHash: string;
  isAdmin: boolean;
}

/** Where the app keeps its accounts. Names are unique, compared as stored (trimmed). */
export interface AccountStore {
  count: () => Promise<number>;
  findByName: (name: string) => Promise<LocalAccount | null>;
  findById: (id: string) => Promise<LocalAccount | null>;
  create: (account: Omit<LocalAccount, 'id'>) => Promise<LocalAccount>;
}

export const SESSION_COOKIE = 'zx_lite_session';
/** How long a sign-in lasts: 30 days, in seconds. */
export const SESSION_SECONDS = 2_592_000;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;
export const NAME_MAX = 80;
/** The shortest secret accepted: an install's secret is random, never a word. */
export const SECRET_MIN = 32;

const SCRYPT = { N: 16_384, r: 8, p: 1, keyLength: 64, saltLength: 16, maxmem: 67_108_864 } as const;
const MS_PER_SECOND = 1000;
/** A session token is `account.expires.signature`. */
const TOKEN_PARTS = 3;
/** A stored password is `scrypt$N$r$p$salt$key`. */
const HASH_PARTS = 6;
const SIGN_IN_FIRST = 'Sign in first';

/**
 * The one comparison of secrets (signatures, password keys): Node's constant-time comparison, kept
 * behind an object so a test can watch every secret comparison go through it.
 */
export const secureCompare = { equal: timingSafeEqual };

const derive = (password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT.keyLength, { N, r, p, maxmem: SCRYPT.maxmem }, (error, key) => {
      if (error === null) {
        resolve(key);
      } else {
        reject(error);
      }
    });
  });

/** A password's stored form: `scrypt$N$r$p$salt$key`, salt and key in base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT.saltLength);
  const key = await derive(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

/** Whether `password` is the one `stored` was made from; false for anything malformed. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== HASH_PARTS || parts[0] !== 'scrypt') {
    return false;
  }
  const [, n, r, p, salt, key] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(key, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p)).catch(() => null);
  return actual !== null && actual.length === expected.length && secureCompare.equal(actual, expected);
}

const sign = (payload: string, secret: string): string => createHmac('sha256', secret).update(payload).digest('base64url');

/** A session token for `accountId`, good until `expires` (seconds since the epoch). */
export function sessionToken(accountId: string, expires: number, secret: string): string {
  const payload = `${accountId}.${expires}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** The account a token names, if it is signed with `secret` and has not expired; else null. */
export function sessionAccount(token: string, secret: string, now: number = Date.now() / MS_PER_SECOND): string | null {
  const parts = token.split('.');
  if (parts.length !== TOKEN_PARTS) {
    return null;
  }
  const [accountId, expires, signature] = parts as [string, string, string];
  const expected = Buffer.from(sign(`${accountId}.${expires}`, secret));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !secureCompare.equal(given, expected)) {
    return null;
  }
  return Number(expires) > now ? accountId : null;
}

function checkedSecret(secret: string): string {
  if (secret.length < SECRET_MIN) {
    throw new Error(`The session secret must be at least ${SECRET_MIN} characters`);
  }
  return secret;
}

function cookieValue(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

/** The signed-in account, or null. */
async function signedIn(request: NextRequest, store: AccountStore, secret: string): Promise<LocalAccount | null> {
  const token = cookieValue(request);
  const accountId = token === null ? null : sessionAccount(token, secret);
  return accountId === null ? null : store.findById(accountId);
}

/**
 * The `OwnerResolver` for an app with local accounts: the signed-in account, after the same
 * cross-site checks `localOwner` makes; 401 with no session.
 */
export function accountsOwner(store: AccountStore, secret: string): OwnerResolver {
  checkedSecret(secret);
  return async (request: NextRequest): Promise<Owner> => {
    refuseCrossSiteWrite(request);
    const account = await signedIn(request, store, secret);
    if (account === null) {
      throw new ApiError(STATUS.UNAUTHORIZED, SIGN_IN_FIRST);
    }
    return { id: account.id };
  };
}

const publicAccount = (account: LocalAccount): { id: string; name: string; is_admin: boolean } => ({
  id: account.id,
  name: account.name,
  is_admin: account.isAdmin,
});

function sessionCookie(request: NextRequest, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function signedInResponse(request: NextRequest, account: LocalAccount, secret: string, status: number): Response {
  const token = sessionToken(account.id, Math.floor(Date.now() / MS_PER_SECOND) + SESSION_SECONDS, secret);
  return Response.json(
    { account: publicAccount(account) },
    { status, headers: { 'Set-Cookie': sessionCookie(request, token, SESSION_SECONDS) } },
  );
}

/** The object a request names under its key, or an empty one (credentials() then names what's missing). */
function named(body: object, key: string): object {
  const value: unknown = Reflect.get(body, key);
  return typeof value === 'object' && value !== null ? value : {};
}

function credentials(body: object): { name: string; password: string } {
  const name = requiredString(body, 'name').trim();
  const password = requiredString(body, 'password');
  if (name === '' || name.length > NAME_MAX) {
    throw validationError(`A name of 1 to ${NAME_MAX} characters is required`, 'name');
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw validationError(`A password of ${PASSWORD_MIN} to ${PASSWORD_MAX} characters is required`, 'password');
  }
  return { name, password };
}

/** The account routes' handlers (see `accountRoutes`). */
export interface AccountRoutes {
  signIn: (request: NextRequest) => Promise<Response>;
  signOut: (request: NextRequest) => Response;
  me: (request: NextRequest) => Promise<Response>;
  create: (request: NextRequest) => Promise<Response>;
}

/**
 * The account routes: `POST` sign-in (`{ "sign_in": { name, password } }`), sign-out, and create
 * (`{ "account": { name, password } }`: the first account, the admin, by anyone, and it signs in;
 * later ones by the admin only), and `GET` me.
 */
export function accountRoutes(store: AccountStore, secret: string): AccountRoutes {
  checkedSecret(secret);
  return {
    async signIn(request: NextRequest): Promise<Response> {
      try {
        refuseCrossSiteWrite(request);
        const { name, password } = credentials(named(await readJsonObject(request), 'sign_in'));
        const account = await store.findByName(name);
        // The same answer for an unknown name and a wrong password: names aren't confirmed.
        if (account === null || !(await verifyPassword(password, account.passwordHash))) {
          throw new ApiError(STATUS.UNAUTHORIZED, 'That name and password do not match');
        }
        return signedInResponse(request, account, secret, STATUS.OK);
      } catch (error) {
        return apiErrorResponse(error);
      }
    },

    signOut(request: NextRequest): Response {
      try {
        refuseCrossSiteWrite(request);
        return new Response(null, {
          status: STATUS.NO_CONTENT,
          headers: { 'Set-Cookie': sessionCookie(request, '', 0) },
        });
      } catch (error) {
        return apiErrorResponse(error);
      }
    },

    async me(request: NextRequest): Promise<Response> {
      const account = await signedIn(request, store, secret);
      return account === null
        ? apiErrorResponse(new ApiError(STATUS.UNAUTHORIZED, SIGN_IN_FIRST))
        : Response.json({ account: publicAccount(account) });
    },

    async create(request: NextRequest): Promise<Response> {
      try {
        refuseCrossSiteWrite(request);
        const { name, password } = credentials(named(await readJsonObject(request), 'account'));
        const first = (await store.count()) === 0;
        if (!first) {
          const admin = await signedIn(request, store, secret);
          if (admin === null) {
            throw new ApiError(STATUS.UNAUTHORIZED, SIGN_IN_FIRST);
          }
          if (!admin.isAdmin) {
            throw new ApiError(STATUS.FORBIDDEN, 'Only the admin adds people');
          }
        }
        if ((await store.findByName(name)) !== null) {
          throw validationError('That name is taken', 'name');
        }
        const account = await store.create({ name, passwordHash: await hashPassword(password), isAdmin: first });
        // The first account signs in at once; the admin adding someone stays signed in as themself.
        return first
          ? signedInResponse(request, account, secret, STATUS.CREATED)
          : Response.json({ account: publicAccount(account) }, { status: STATUS.CREATED });
      } catch (error) {
        return apiErrorResponse(error);
      }
    },
  };
}
