# @zephyrex/auth-device-pairing

Device pairing in a Zephyrex app: sign in on a new device by scanning its code with one that is
already signed in. It is the client half of the Zephyrex server's `auth_device_pairing` extension.

## Install

```bash
pnpm add @zephyrex/auth-device-pairing
```

Peer dependencies: `zephyrex`, `@zephyrex/auth`, `@jgrieve/forms`, `react` and `zod`.

## Use

```typescript
import { authDevicePairingExtension } from '@zephyrex/auth-device-pairing';

const config: ZephyrexConfig = { extensions: [authDevicePairingExtension] };
```

It adds two auth pages and a sign-in option:

- `<authPath>/pair`: shows the code on the device that wants to sign in.
- `<authPath>/pair/approve`: the page the code opens on the signed-in device. It needs a session.
- **Sign in with another device** on the welcome page, linking to the first.

Point the server's `PAIRING_BASE_URL` at `<app><authPath>/pair`.

## Exports

- Extension and pages: `authDevicePairingExtension`, `PairRequest`, `PairApprove`, `PAIRING_POLL_MS`.
- Data: `requestPairing`, `pairingStatus`, `answerPairing`, `PAIRING_ENDPOINT`, and the types
  `PairingStart`, `PairingState`, `PairingAnswer` and `PairingDecision`.

## License

AGPL-3.0-or-later
