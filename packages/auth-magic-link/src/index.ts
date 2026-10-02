// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's auth_magic_link extension (zephyrex[auth-magic-link]): signing in
// from a link emailed to the user. The flow itself is the auth pages' generic magic-link mode; this
// extension turns it on for a Zephyrex app.
export { authMagicLinkExtension } from './extension';
