# @zephyrex/auth-invitations

Team invitations in a Zephyrex app: answering invitations from the account page, and inviting people
from the team page. It is the client half of the Zephyrex server's `auth_invitations` extension.

## Install

```bash
pnpm add @zephyrex/auth-invitations
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `react`, `swr` and `zod`.

## Use

```typescript
import { authInvitationsExtension } from '@zephyrex/auth-invitations';

const config: ZephyrexConfig = { extensions: [authInvitationsExtension] };
```

It adds two things:

- An **Invitations** section on the account page, for the invitations awaiting the user's answer.
- On the team page, the invite form and the team's pending invitations.

## Exports

- Extension and sections: `authInvitationsExtension`, `PendingInvitations`, `TeamInvitations`,
  `InviteForm`.
- Data: `useUserInvitations`, `USER_INVITATIONS_ENDPOINT`, `useTeamInvitations`,
  `useInvitationActions`, and their types.

## License

AGPL-3.0-or-later
