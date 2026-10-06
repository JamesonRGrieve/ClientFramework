# @zephyrex/payment

Subscribing in a Zephyrex app: the page a user without a subscription lands on, with the payment
provider's hosted pricing table. It is the client half of the Zephyrex server's `payment` extension.

## Install

```bash
pnpm add @zephyrex/payment
```

Peer dependencies: `zephyrex`, `cookies-next`, `next` and `react`.

## Use

`paymentExtension` takes the app's Stripe pricing table, read from the app's own configuration:

```typescript
import { paymentExtension } from '@zephyrex/payment';

const config: ZephyrexConfig = {
  extensions: [paymentExtension({ pricingTableId: 'prctbl_…', publishableKey: 'pk_…' })],
};
```

It adds the auth page `<authPath>/subscribe`. The auth middleware sends the user there when the
server answers 402. With no pricing table configured, the page says subscribing is not available
there.

The pricing table's script is added by the app's own code, so the Content-Security-Policy's
`'strict-dynamic'` allows it.

## Exports

`paymentExtension`, `Subscribe`, `STRIPE_PRICING_TABLE_SCRIPT` and the type `StripePricingTable`.

## License

AGPL-3.0-or-later
