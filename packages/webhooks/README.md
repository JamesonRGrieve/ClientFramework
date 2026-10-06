# @zephyrex/webhooks

Webhooks in a Zephyrex app: the user's outbound webhook subscriptions, and what was delivered to
them. It is the client half of the Zephyrex server's `webhooks` extension.

## Install

```bash
pnpm add @zephyrex/webhooks
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { webhooksExtension } from '@zephyrex/webhooks';

const config: ZephyrexConfig = { extensions: [webhooksExtension] };
```

It adds these pages, and a **Webhooks** menu entry:

- `/webhooks`: the user's subscriptions, and a form to subscribe.
- `/webhooks/:subscriptionId`: one subscription, with its settings and its deliveries.

Deliveries are signed with the subscription's secret. A generated secret is shown once, as it is set,
because the server never sends it back.

## Exports

- Extension and pages: `webhooksExtension`, `WebhooksPage`, `SubscriptionPage`, and the paths
  `WEBHOOKS_PATH` and `subscriptionPagePath`.
- Data: `useSubscriptions`, `useSubscription`, `useSubscriptionActions`, `createSubscription`,
  `useDeliveries`, `DELIVERY_STATUSES`, `generateSecret`, `MIN_SECRET_LENGTH`, and the zod schemas and
  types for each.

## License

AGPL-3.0-or-later
