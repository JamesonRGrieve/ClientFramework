# @zephyrex/maps

Meeting in the middle in a Zephyrex app: pick two or more places, see the point halfway between
them, how far each person travels to get there, and places to meet nearby (restaurants, cafés,
parks and the other kinds the server offers). It is the client half of the Zephyrex server's
`maps` extension (`/v1/maps`).

## Install

```bash
pnpm add @zephyrex/maps
```

Peer dependencies: `zephyrex`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { mapsExtension } from '@zephyrex/maps';

const config: ZephyrexConfig = { extensions: [mapsExtension] };
```

It adds a **Meet in the middle** menu entry and the page `/meet`, where people type the places to
meet between. `MeetInTheMiddle` takes `known` (`{ label, location }[]`), places the app already
knows (a partner's home, say), offered to pick from beside typed ones; an app that knows such places
mounts its own page that passes them.

Places come from the server's map providers (OpenStreetMap by default); the page credits
OpenStreetMap's contributors.

## Exports

- Extension and page: `mapsExtension`, `MeetInTheMiddle`, `MEET_PATH`.
- Reads and writes: `usePlaceCategories`, `findMidpoint`, and the endpoint `MAPS_ENDPOINT`.
- Model: `PlaceSchema`, `MidpointSchema`, `MODES`, and the helpers `distanceLabel`, `durationLabel`
  and `mapLink`.

## License

AGPL-3.0-or-later.
