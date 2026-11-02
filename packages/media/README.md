# @zephyrex/media

Shared watch-lists in a Zephyrex app: start a list, share it with the people you watch with, add
titles from the film catalogue (TMDb through the server), say which you want to see, and let it
pick tonight's: something everyone on the list wants, the same pick for all of you until tomorrow.
It is the client half of the Zephyrex server's `media` extension (`/v1/watch-lists`).

## Install

```bash
pnpm add @zephyrex/media
```

Peer dependencies: `zephyrex`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { mediaExtension } from '@zephyrex/media';

const config: ZephyrexConfig = { extensions: [mediaExtension] };
```

It adds a **Watch-list** menu entry and the page `/watch-list`. `WatchListPage` takes `people`
(`{ userId, name }[]`), the accounts the app knows: they name who wants what and can be added to a
list. `wrapStart` wraps the form that starts a list, for an app that only lets some plans keep one.

The page carries TMDb's required notice when titles come from TMDb.

## Exports

- Extension and page: `mediaExtension`, `WatchListPage`, `WATCH_LIST_PATH`.
- Reads and writes: `useWatchLists`, `useMediaSearch`, `usePick`, `useWatchListActions`, and the
  endpoint `WATCH_LISTS_ENDPOINT`.
- Model: `WatchListSchema`, `TitleSchema`, `MediaItemSchema`, `PickSchema`.

## License

AGPL-3.0-or-later.
