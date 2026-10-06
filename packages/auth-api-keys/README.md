# @zephyrex/auth-api-keys

API keys in a Zephyrex app: the signed-in user's keys, issued, rotated and revoked from the account
page. It is the client half of the Zephyrex server's `auth_api_keys` extension.

## Install

```bash
pnpm add @zephyrex/auth-api-keys
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `react`, `swr` and `zod`.

## Use

```typescript
import { authApiKeysExtension } from '@zephyrex/auth-api-keys';

const config: ZephyrexConfig = { extensions: [authApiKeysExtension] };
```

It adds an **API Keys** section to the account page.

## Exports

- Extension and section: `authApiKeysExtension`, `ApiKeys`.
- Data: `API_KEYS_ENDPOINT`, `expiryFromDate`, and `ApiKeySchema` and `IssuedKeySchema` with the types
  `ApiKey` and `IssuedKey`.

## License

AGPL-3.0-or-later
