// SPDX-License-Identifier: AGPL-3.0-or-later
import { looksSecret } from '@zephyrex/auth/publicEnv';

/**
 * Runtime public config: one build serves prod and dev with only runtime env apart (the operator,
 * 2026-11-25). `publicEnv(name)` reads the instance's value (runtime env on the server, the `zx_env`
 * cookie the middleware sets in the browser) and falls back to the build's NEXT_PUBLIC_<name>. Only
 * functional values are runtime; what pages prerender for search and sharing keeps the build's.
 */
export { cookieDomainOptions, PUBLIC_ENV_COOKIE, publicEnv } from '@zephyrex/auth/publicEnv';

/** The values every app serves from runtime env; an app adds its own with `config.runtimeEnv`. */
export const RUNTIME_PUBLIC_ENV: readonly string[] = ['APP_URI', 'COOKIE_DOMAIN', 'ENV'];

const IPV4_PARTS = 4;
const DIGITS = /^\d{1,3}$/;
/** The labels a registrable domain keeps: example.com of dev.rpg.example.com. */
const REGISTRABLE_LABELS = 2;

const isIpv4 = (host: string): boolean => {
  const parts = host.split('.');
  return parts.length === IPV4_PARTS && parts.every((part) => DIGITS.test(part));
};

/** The registrable domain of `uri` (an IP stays whole), so cookies are shared with its subdomains. */
export function registrableDomain(uri: string): string | undefined {
  let host: string;
  try {
    host = new URL(uri).hostname;
  } catch {
    return undefined;
  }
  if (host === '' || host === 'localhost') {
    return undefined;
  }
  return isIpv4(host) ? host : host.split('.').slice(-REGISTRABLE_LABELS).join('.');
}

/**
 * The runtime public values to serve, by name: each allowlisted name's runtime env value, and the
 * cookie domain from APP_URI when it isn't set. A name that reads as a secret is refused outright.
 */
export function runtimePublicEnv(
  extra: readonly string[] = [],
  env: Readonly<Record<string, string | undefined>> = process.env,
): Record<string, string> {
  const runtime = new Map(Object.entries(env));
  const values = new Map<string, string>();
  for (const name of [...RUNTIME_PUBLIC_ENV, ...extra]) {
    if (looksSecret(name)) {
      throw new Error(`runtimeEnv '${name}' looks like a secret, and runtime env is served to the browser.`);
    }
    const value = runtime.get(name);
    if (value !== undefined && value !== '') {
      values.set(name, value);
    }
  }
  const appUri = values.get('APP_URI');
  const domain = appUri === undefined ? undefined : registrableDomain(appUri);
  if (!values.has('COOKIE_DOMAIN') && domain !== undefined) {
    values.set('COOKIE_DOMAIN', domain);
  }
  return Object.fromEntries(values);
}

/** The `zx_env` cookie's value for `values`, before Next URI-encodes it (the browser decodes it once). */
export const publicEnvCookieValue = (values: Readonly<Record<string, string>>): string => JSON.stringify(values);
