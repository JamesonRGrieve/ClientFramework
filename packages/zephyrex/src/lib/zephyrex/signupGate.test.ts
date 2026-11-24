// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { signupDecision, signupGateFromEnv } from './signupGate';

const ORIGIN = 'https://app.example.com';
const AUTH = '/user';
const REGISTER = `${ORIGIN}${AUTH}/register`;
const CLOSED = { mode: 'closed' } as const;

const at = (path: string): URL => new URL(path, ORIGIN);

describe('signupGateFromEnv', () => {
  it('reads the server’s REGISTRATION_MODE and the target, open when unset or unknown', () => {
    expect(signupGateFromEnv({})).toEqual({ mode: 'open', disabledPath: undefined });
    expect(signupGateFromEnv({ REGISTRATION_MODE: ' Closed ', SIGNUP_DISABLED_PATH: '/waitlist' })).toEqual({
      mode: 'closed',
      disabledPath: '/waitlist',
    });
    expect(signupGateFromEnv({ REGISTRATION_MODE: 'invite' }).mode).toBe('invite');
    expect(signupGateFromEnv({ REGISTRATION_MODE: 'nobody' }).mode).toBe('open');
  });
});

describe('signupDecision', () => {
  it('lets every page through while sign-up is open or invite-only', () => {
    for (const mode of ['open', 'invite'] as const) {
      expect(signupDecision(new URL(REGISTER), AUTH, { mode, disabledPath: '/waitlist' })).toEqual({ kind: 'pass' });
    }
  });

  it('finds no sign-up page when closed with no target', () => {
    expect(signupDecision(new URL(REGISTER), AUTH, CLOSED)).toEqual({ kind: 'notFound' });
    expect(signupDecision(at(`${AUTH}/register/verify`), AUTH, { ...CLOSED, disabledPath: '  ' })).toEqual({
      kind: 'notFound',
    });
  });

  it('sends the sign-up page to the target when closed, a path or another site', () => {
    expect(signupDecision(new URL(REGISTER), AUTH, { ...CLOSED, disabledPath: '/waitlist' })).toEqual({
      kind: 'redirect',
      url: at('/waitlist'),
    });
    expect(signupDecision(new URL(REGISTER), AUTH, { ...CLOSED, disabledPath: 'https://example.org/join' })).toEqual({
      kind: 'redirect',
      url: new URL('https://example.org/join'),
    });
  });

  it('keeps sign-in open, and never sends the sign-up page back to itself', () => {
    for (const path of [AUTH, `${AUTH}/login`, `${AUTH}/registered`, '/register']) {
      expect(signupDecision(at(path), AUTH, { ...CLOSED, disabledPath: '/waitlist' })).toEqual({ kind: 'pass' });
    }
    expect(signupDecision(new URL(REGISTER), AUTH, { ...CLOSED, disabledPath: `${AUTH}/register` })).toEqual({
      kind: 'notFound',
    });
  });

  it('sends the email sign-up page to the welcome page under single sign-on, whatever the target', () => {
    const sso = { mode: 'sso', disabledPath: '/waitlist' } as const;
    expect(signupDecision(new URL(REGISTER), AUTH, sso)).toEqual({ kind: 'redirect', url: at(AUTH) });
    expect(signupDecision(at(`${AUTH}/register/verify`), AUTH, sso)).toEqual({ kind: 'redirect', url: at(AUTH) });
    expect(signupDecision(at('/register'), '', sso)).toEqual({ kind: 'redirect', url: at('/') });
    for (const path of [AUTH, `${AUTH}/login`, `${AUTH}/close/authentik`]) {
      expect(signupDecision(at(path), AUTH, sso)).toEqual({ kind: 'pass' });
    }
  });
});
