# @zephyrex/ecommerce

E-commerce in a Zephyrex app: the orders, products and returns read from the user's stores, their
sales, and syncing a store. It is the client half of the Zephyrex server's `ecommerce` extension.

## Install

```bash
pnpm add @zephyrex/ecommerce
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { ecommerceExtension } from '@zephyrex/ecommerce';

const config: ZephyrexConfig = { extensions: [ecommerceExtension] };
```

It adds these pages, and a **Stores** menu entry:

- `/store`: the user's stores.
- `/store/orders`, `/store/products` and `/store/returns`: what was read from them.

## Exports

- Extension and pages: `ecommerceExtension`, `StorePage`, `OrdersPage`, `ProductsPage`, `ReturnsPage`,
  and the paths `STORE_PATH`, `ORDERS_PATH`, `PRODUCTS_PATH` and `RETURNS_PATH`.
- Data: `useStores`, `useOrders`, `useProducts`, `useReturns`, `useSalesReport`, `REPORT_PERIODS`,
  `syncStore`, and the zod schemas and types for each.

## License

AGPL-3.0-or-later
