# @zephyrex/agreements

Written agreements in a Zephyrex app: what people have agreed, which each of them confirms and they
revisit together. Any change to the terms asks everyone to confirm
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
them; `wrapStart`, which wraps the form that starts one (to offer a plan instead, say); `kinds`, the
kinds of term (`{ value, heading, choice }[]`, the same values the server's `register_term_kinds`
names; `DEFAULT_KINDS` when left out); and `intro`, what the page says under its heading.

## Exports

- Extension and page: `agreementsExtension`, `AgreementsPage`, `AGREEMENTS_PATH`, `listed`.
- Reads and writes: `useAgreements`, `agreementsApi`, and the endpoint `AGREEMENTS_ENDPOINT`.
- Model: `AgreementSchema`, `DEFAULT_KINDS`, `shownKind`, `dueForRevisit`.

## License

AGPL-3.0-or-later.
