// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { publicEnvCookieValue, registrableDomain, runtimePublicEnv } from './publicEnv';

const SITE = 'https://a.example.com';

describe('runtimePublicEnv', () => {
  it('serves the allowlisted runtime values, and the cookie domain from APP_URI', () => {
    expect(
      runtimePublicEnv([], { APP_URI: 'https://dev.rpg.example.com', ENV: 'dev', API_URI: 'http://server:1996' }),
    ).toEqual({
      APP_URI: 'https://dev.rpg.example.com',
      COOKIE_DOMAIN: 'example.com',
      ENV: 'dev',
    });
  });

  it('keeps a cookie domain the instance sets, and an app’s own names', () => {
    expect(
      runtimePublicEnv(['MAP_TILES_URI'], {
        APP_URI: SITE,
        COOKIE_DOMAIN: 'a.example.com',
        MAP_TILES_URI: 'https://tiles',
      }),
    ).toEqual({ APP_URI: SITE, COOKIE_DOMAIN: 'a.example.com', MAP_TILES_URI: 'https://tiles' });
  });

  it('serves nothing unset or empty', () => {
    expect(runtimePublicEnv([], { APP_URI: '' })).toEqual({});
  });

  it('refuses a name that reads as a secret', () => {
    expect(() => runtimePublicEnv(['API_KEY'], {})).toThrow('looks like a secret');
  });
});

describe('registrableDomain', () => {
  it('is the last two labels, an IP whole, and nothing for localhost or junk', () => {
    expect(registrableDomain('https://dev.rpg.example.com:8443/x')).toBe('example.com');
    expect(registrableDomain('http://192.168.5.10:1109')).toBe('192.168.5.10');
    expect(registrableDomain('http://localhost:1109')).toBeUndefined();
    expect(registrableDomain('not a url')).toBeUndefined();
  });
});

describe('publicEnvCookieValue', () => {
  it('is the values as JSON, for Next to encode', () => {
    expect(publicEnvCookieValue({ APP_URI: SITE })).toBe('{"APP_URI":"https://a.example.com"}');
  });
});
