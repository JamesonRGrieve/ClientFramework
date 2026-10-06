# @zephyrex/social

Social posts in a Zephyrex app: the record of what the server published to the user's social
accounts. It is the client half of the Zephyrex server's `social` extension. The accounts themselves
are provider instances, set up on the provider pages.

## Install

```bash
pnpm add @zephyrex/social
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { socialExtension } from '@zephyrex/social';

const config: ZephyrexConfig = { extensions: [socialExtension] };
```

It adds these pages, and a **Social Posts** menu entry:

- `/social`: what was published.
- `/social/:publicationId`: one publication.

## Exports

- Extension and pages: `socialExtension`, `PublicationsPage`, `PublicationPage`, and the paths
  `SOCIAL_PATH` and `publicationPath`.
- Data: `useSocialPublications`, `useSocialPublication`, `platformName`, `linkTarget`,
  `SOCIAL_PUBLICATION_ENDPOINT`, and `SocialPublicationSchema` with the type `SocialPublication`.

## License

AGPL-3.0-or-later
