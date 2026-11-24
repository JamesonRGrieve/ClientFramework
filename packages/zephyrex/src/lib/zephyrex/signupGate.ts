// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Where sign-up goes when the app has it switched off. The client reads the server's own setting,
 * `REGISTRATION_MODE` (open | invite | sso | closed; unset is open), which the pipeline renders into
 * both env files, so the pages and the API agree. Only `closed` turns sign-up away here: an invite or
 * a single-sign-on account still registers through these pages. `SIGNUP_DISABLED_PATH` names where a
 * visitor to the sign-up page is sent instead (an app's waitlist, say); unset, the page is not found.
 * Signing in is never affected.
 */

/** The server's sign-up modes. */
export type RegistrationMode = 'open' | 'invite' | 'sso' | 'closed';

export interface SignupGate {
  mode: RegistrationMode;
  /** A path or an absolute URL; unset or empty means not found. */
  disabledPath?: string | undefined;
}

/** What the middleware does with a request to a sign-up page. */
export type SignupDecision = { kind: 'pass' } | { kind: 'notFound' } | { kind: 'redirect'; url: URL };

const CLOSED: RegistrationMode = 'closed';
const MODES: ReadonlySet<string> = new Set(['open', 'invite', 'sso', CLOSED]);
const PASS: SignupDecision = { kind: 'pass' };

function isMode(value: string): value is RegistrationMode {
  return MODES.has(value);
}

/** The gate from the environment. An unknown mode counts as open, as an unset one does. */
export function signupGateFromEnv(env: Readonly<Record<string, string | undefined>> = process.env): SignupGate {
  const mode = env.REGISTRATION_MODE?.trim().toLowerCase() ?? '';
  return { mode: isMode(mode) ? mode : 'open', disabledPath: env.SIGNUP_DISABLED_PATH };
}

/**
 * The decision for `url` under `authPath`: the sign-up page (`<authPath>/register`, and anything under
 * it) is sent away while sign-up is closed; every other page passes. A target that leads back to the
 * page itself counts as unset, so it can never loop.
 */
export function signupDecision(url: URL, authPath: string, gate: SignupGate): SignupDecision {
  const register = `${authPath}/register`;
  const signup = url.pathname === register || url.pathname.startsWith(`${register}/`);
  if (gate.mode !== CLOSED || !signup) {
    return PASS;
  }
  const target = gate.disabledPath?.trim() ?? '';
  if (target === '') {
    return { kind: 'notFound' };
  }
  const destination = new URL(target, url);
  return destination.origin === url.origin && destination.pathname === url.pathname
    ? { kind: 'notFound' }
    : { kind: 'redirect', url: destination };
}
