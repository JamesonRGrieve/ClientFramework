# @zephyrex/observability

Which metrics backend and error reporter a Zephyrex server has wired, for its operator. The
template app shows it on its admin observability page.

## Install

```bash
pnpm add @zephyrex/observability
```

Peer dependencies: `zephyrex`, `react`, `swr` and `zod`.

## Use

```tsx
import { ObservabilityStatus } from '@zephyrex/observability';

<ObservabilityStatus />;
```

It reads `/v1/observability/status` and shows only to the root user.

## Exports

- `ObservabilityStatus`.
- `useObservabilityStatus` and `OBSERVABILITY_STATUS_PATH`, with the types `MetricsStatus`,
  `ErrorReporterStatus` and `ObservabilityStatusResponse`.

## License

AGPL-3.0-or-later
