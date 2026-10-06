# @zephyrex/auth-session

Session management in a Zephyrex app: the signed-in user's active sessions, each of which they can
sign out. It is the client half of the Zephyrex server's `auth_session` extension.

## Install

```bash
pnpm add @zephyrex/auth-session
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `react`, `swr` and `zod`.

## Use

```typescript
import { authSessionExtension } from '@zephyrex/auth-session';

const config: ZephyrexConfig = { extensions: [authSessionExtension] };
```

It adds an **Active Sessions** section to the account page.

## Exports

- Extension and section: `authSessionExtension`, `Sessions`.
- Data: `SESSIONS_ENDPOINT`, `sessionLabel`, and `SessionSchema` with the type `Session`.

## License

AGPL-3.0-or-later
