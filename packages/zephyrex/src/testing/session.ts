// SPDX-License-Identifier: AGPL-3.0-or-later
import { CSRF_COOKIE } from '@zephyrex/auth';
import { deleteCookie, setCookie } from 'cookies-next/client';

/**
 * Give the test browser a session, as a sign-in leaves one: the readable CSRF cookie beside the
 * HttpOnly session cookie. Hooks that need a session only ask the API while it is set.
 * Returns the cleanup that signs out again.
 */
export function withSession(): () => void {
  setCookie(CSRF_COOKIE, 'csrf-test', { path: '/' });
  return () => {
    deleteCookie(CSRF_COOKIE, { path: '/' });
  };
}
