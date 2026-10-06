# @zephyrex/auth-magic-link

Magic-link sign-in in a Zephyrex app: signing in from a link emailed to the user. It is the client
half of the Zephyrex server's `auth_magic_link` extension.

## Install

```bash
pnpm add @zephyrex/auth-magic-link
```

Peer dependency: `zephyrex`.

## Use

```typescript
import { authMagicLinkExtension } from '@zephyrex/auth-magic-link';

const config: ZephyrexConfig = { extensions: [authMagicLinkExtension] };
```

It turns on the auth pages' magic-link sign-in (`authModes.magical`). The welcome page then offers to
email a sign-in link, and the link lands on `<authPath>/magic`. Point the server's
`MAGIC_LINK_BASE_URL` there.

## Exports

`authMagicLinkExtension`.

## License

AGPL-3.0-or-later
