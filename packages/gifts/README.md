# @zephyrex/gifts

Gift ideas in a Zephyrex app: a private list, for the people in someone's life, of what to give
them, with links to the shop and whether each is an idea, bought or given. It is the client half of
the Zephyrex server's `gifts` extension (`/v1/gift`, `/v1/gifts`).

## Install

```bash
pnpm add @zephyrex/gifts
```

Peer dependencies: `zephyrex`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { giftsExtension } from '@zephyrex/gifts';

const config: ZephyrexConfig = { extensions: [giftsExtension] };
```

It adds a **Gifts** menu entry and the page `/gifts`. `GiftsPage` takes `people`
(`{ ref, name }[]`), the people the app knows, to pick who a gift is for, and `ideas`
(`{ forRef, forName, title, note }[]`), suggestions the app draws from what it knows about them
(sizes, favourites), each saved to the list with one click or searched for at the shop.

Links to the shop carry the operator's affiliate tag, which the server adds; the page never sees it.

## Exports

- Extension and page: `giftsExtension`, `GiftsPage`, `GIFTS_PATH`.
- Reads and writes: `useGifts`, `useShopLink`, `giftsApi`, and the endpoint `GIFT_ENDPOINT`.
- Model: `GiftSchema`, `STATUSES`, `statusLabel`.

## License

AGPL-3.0-or-later.
