# @zephyrex/webauthn-consumer

Passkeys in a Zephyrex app: signing in with a passkey, answering a second-factor challenge with a
security key, and the user's own passkeys and security keys. It is the client half of the Zephyrex
server's `webauthn_consumer` extension.

## Install

```bash
pnpm add @zephyrex/webauthn-consumer
```

Peer dependencies: `zephyrex`, `@zephyrex/auth`, `@jgrieve/forms`, `react`, `swr` and `zod`.

## Use

```typescript
import { webauthnConsumerExtension } from '@zephyrex/webauthn-consumer';

const config: ZephyrexConfig = { extensions: [webauthnConsumerExtension] };
```

It does two things:

- It turns on passkey sign-in on the auth pages (`authModes.passkey`), where the browser supports it.
- It adds a **Passkeys** section to the account page. There the user registers a passkey or security
  key, and renames or removes each one. A credential the server disabled as a possible copy says so.

The server must be configured as a relying party for the app's origin: `WEBAUTHN_CONSUMER_RP_ID`,
`WEBAUTHN_CONSUMER_RP_NAME` and `WEBAUTHN_CONSUMER_ORIGINS`.

## Exports

- Extension and section: `webauthnConsumerExtension`, `Passkeys`.
- Data: `useCredentials`, `useCredentialActions`, `registerPasskey`, plus `CredentialSchema` and the
  types `PasskeyCredential`, `CredentialActions` and `Attachment`.

## License

AGPL-3.0-or-later
