# @zephyrex/health

A health log in a Zephyrex app: the user's activities, meals, weights and sleep. It is the client
half of the Zephyrex server's `health` extension.

## Install

```bash
pnpm add @zephyrex/health
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { healthExtension } from '@zephyrex/health';

const config: ZephyrexConfig = { extensions: [healthExtension] };
```

It adds these pages, and a **Health** menu entry:

- `/health`: today's figures for each kind of record.
- `/health/:kind`: the log of one kind: activities, meals, weights or sleep.

## Exports

- Extension and pages: `healthExtension`, `HealthPage`, `RecordsPage`, and the paths `HEALTH_PATH` and
  `recordsPath`.
- Data: `useRecords`, `useRecordActions`, `createRecord`, the record types `activityType`, `mealType`,
  `weightType`, `sleepType` and `RECORD_TYPES`, and the zod schemas and types for each.

## License

AGPL-3.0-or-later
