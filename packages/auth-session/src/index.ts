// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's auth_session extension (zephyrex[auth-session]): the signed-in
// user's active sessions, each of which they can sign out from the account page.
export { authSessionExtension } from './extension';
export { SessionSchema, sessionLabel, Sessions, SESSIONS_ENDPOINT } from './Sessions';
export type { Session } from './Sessions';
