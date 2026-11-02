# @zephyrex/payment

Paying in a Zephyrex app: the page a user without a subscription lands on, with the payment
provider's hosted pricing table, and a Square card checkout for products sold once. It is the client half of the Zephyrex server's `payment` extension.

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

## One-time purchases with Square

`SquareCheckout` buys a product the server sells once (entitlements' `register_product`) with a
card, through Square's own card form, so the card number never touches the app. It reads the
product's price from `GET /v1/entitlement/products` and posts only the product id and Square's
one-time card token to `POST /v1/entitlement/purchase`; the server charges its own price.

```tsx
import { SquareCheckout, squareCspAdditions } from '@zephyrex/payment';

<SquareCheckout
  applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID}
  locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID}
  environment='production'
  productId='full_report'
  onPurchased={() => router.refresh()}
/>;
```

Add Square's hosts to the app's Content-Security-Policy with `squareCspAdditions(environment)`
(from Square's published Web Payments policy). With no application or location id, the form says
card payments are not available.

## Exports

`paymentExtension`, `Subscribe`, `STRIPE_PRICING_TABLE_SCRIPT`, `SquareCheckout`, `squareCspAdditions`,
`squareScript`, `loadSquareSdk`, `formatPrice`, and the types `StripePricingTable`, `SquareAccount`,
`SquareCheckoutProps`, `SquareEnvironment`, `SquareCard`, `SquareSdk`, `Product` and `Purchase`.

## License

AGPL-3.0-or-later
