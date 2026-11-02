# @zephyrex/agreements

Written agreements in a Zephyrex app: what people have agreed, likes and limits included, which
each of them confirms and they revisit together. Any change to the terms asks everyone to confirm
again. It is the client half of the Zephyrex server's `agreements` extension (`/v1/agreements`).

## Install

```bash
pnpm add @zephyrex/agreements
```

Peer dependencies: `zephyrex`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { agreementsExtension } from '@zephyrex/agreements';

const config: ZephyrexConfig = { extensions: [agreementsExtension] };
```

It adds an **Agreements** menu entry and the page `/agreements`. `AgreementsPage` takes `people`
(`{ userId, name }[]`), the accounts the app knows, to choose who an agreement is with and to name
them, and `wrapStart`, which wraps the form that starts one (to offer a plan instead, say).

## Exports

- Extension and page: `agreementsExtension`, `AgreementsPage`, `AGREEMENTS_PATH`, `listed`.
- Reads and writes: `useAgreements`, `agreementsApi`, and the endpoint `AGREEMENTS_ENDPOINT`.
- Model: `AgreementSchema`, `KINDS`, `kindLabel`, `kindChoice`, `dueForRevisit`.

## License

AGPL-3.0-or-later.
