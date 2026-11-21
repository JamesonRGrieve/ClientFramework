# @zephyrex/rooms

Live changes to a record for everyone who may see it. A room is a record (a scene, a conversation,
a team). Whoever can view that record can join its room, and each change in it says which record
changed and how, never what it now holds. The app refetches that record through its own API, or
drops it on `deleted`. It is the client half of the Zephyrex server's `rooms` extension
(`/v1/room/{type}/{id}/events` and `/changes`).

## Install

```bash
pnpm add @zephyrex/rooms
```

Peer dependencies: `zephyrex`, `react` and `zod`. The server needs `rooms` in its
`APP_EXTENSIONS`.

## Use

```typescript
import { roomsExtension, useRoom } from '@zephyrex/rooms';

const config: ZephyrexConfig = { extensions: [roomsExtension] };

// On a page that shows a scene:
const status = useRoom(
  { type: 'scene', id: scene.id },
  (change) => {
    if (change.op === 'deleted') dropToken(change.record.id);
    else void mutate(tokenKey(change.record.id)); // skip it when you already hold change.etag
  },
  { onReset: () => void mutate(sceneKeys) },
);
```

`type` is the server's name for the record's type (`scene` for `SceneModel`, `user_team`).
`useRoom` follows the room over server-sent events with the session's credentials. The browser
reconnects and catches up from the last change it saw. Each change is handed on once, in order.
When the stream can't be had (no `EventSource`, or a refused connection), it polls `/changes`
instead, every 5 s by default (`pollIntervalMs`), or always with `transport: 'poll'`.

`onReset` means the changes since the last one handed on are gone (kept an hour on the server,
or too many to replay): refetch the room's data. The hook returns the room's status: `connecting`,
`live`, `polling`, `revoked` (the user may no longer see the room; it stops), `missing` (no such
room for this user; it stops) or `off` (no room, or `enabled: false`).

## Exports

- Hook and extension: `useRoom`, `roomsExtension`, `POLL_INTERVAL_MS`, and the types
  `RoomOptions` and `RoomStatus`.
- Model: `RoomChangeSchema`, `RoomChangePageSchema`, `RecordRefSchema`, `roomPath`,
  `ROOM_ENDPOINT`, `MAX_CHANGES_PAGE`, and the types `RoomChange`, `RoomChangePage` and `RoomRef`.

## License

AGPL-3.0-or-later.
