// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's auth_api_keys extension (zephyrex[auth-api-keys]): the signed-in
// user's API keys, issued, rotated and revoked from the account page.
export { API_KEYS_ENDPOINT, ApiKeys, ApiKeySchema, expiryFromDate, IssuedKeySchema } from './ApiKeys';
export type { ApiKey, IssuedKey } from './ApiKeys';
export { authApiKeysExtension } from './extension';
