# @zephyrex/auth-mfa

Two-factor authentication in a Zephyrex app: the signed-in user's authenticator app, recovery codes
and second factors. It is the client half of the Zephyrex server's `auth_mfa` extension.

## Install

```bash
pnpm add @zephyrex/auth-mfa
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `react`, `swr` and `zod`.

## Use

```typescript
import { authMfaExtension } from '@zephyrex/auth-mfa';

const config: ZephyrexConfig = { extensions: [authMfaExtension] };
```

It adds a **Two-factor authentication** section to the account page.

## Exports

- Extension and section: `authMfaExtension`, `MfaSettings`.
- Data: `mfaApi`, `useMfaMethods`, `MFA_ENDPOINT`, and `MfaMethodSchema` and `TotpProvisioningSchema`
  with the types `MfaMethod` and `TotpProvisioning`.

## License

AGPL-3.0-or-later
