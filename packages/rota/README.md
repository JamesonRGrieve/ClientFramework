# @zephyrex/rota

A nights rota in a Zephyrex app: a cycle of nights that repeats, whom each night is with, and
one-night swaps that move only once both people agree. It is the client half of the Zephyrex
server's `rota` extension.

## Install

```bash
pnpm add @zephyrex/rota
```

Peer dependencies: `zephyrex`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { rotaExtension } from '@zephyrex/rota';

const config: ZephyrexConfig = { extensions: [rotaExtension] };
```

It adds a **Nights rota** menu entry and the page `/rota`: each rota you keep or have a night in,
the next two weeks of it, the swaps between you and someone else, and, for a rota you keep, its
cycle.

`RotaPage` takes `people` (`{ userId, name }[]`), the accounts the app knows: they name the nights
and can be given them. Without it, the page names you and calls everyone else "Someone"; an app
that knows people mounts its own page that passes them.

## Exports

- Extension and page: `rotaExtension`, `RotaPage`, `ROTA_PATH`.
- Reads and writes: `useMyRotas`, `useSchedule`, `useSwaps`, `useRotaActions`, and the endpoints
  `ROTA_ENDPOINT` and `ROTA_NIGHT_ENDPOINT`.
- Model: `RotaSchema`, `RotaNightSchema`, `ScheduledNightSchema`, `SwapSchema`, `MAX_CYCLE_DAYS`,
  and the helpers `isoDay`, `nightLabel`, `cycleNightLabel`, `nightAt` and `membersOf`.

## License

AGPL-3.0-or-later.
