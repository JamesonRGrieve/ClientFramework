# @zephyrex/lite

The API a Zephyrex app's **lite** edition answers from its own Next.js route handlers. The lite
edition is self-hosted and has no Zephyrex server. These handlers answer `/api/v1/*` in exactly
the shape server-framework does, so the same UI runs against either back end:

- the `{ <resource> }` / `{ <resources>, pagination }` envelopes;
- an ETag on every record;
- `If-Match` on every write: `428` without it, `412` with `current` when it is stale;
- the framework's error bodies and its request-body cap.

It is server-only. Import it from `route.lite.ts` handlers, never from a client component.

## Install

```bash
pnpm add @zephyrex/lite
```

Peer dependencies: `next` and `zod`.

## Use

Describe how a resource is stored once, then mount the same handlers for every resource:

```typescript
// src/app/api/v1/task/route.lite.ts
import { collectionRoutes, localOwner } from '@zephyrex/lite';
import { taskSpec } from '~/lib/appRecords';

export const { GET, POST } = collectionRoutes(taskSpec, localOwner);
```

```typescript
// src/app/api/v1/task/[id]/route.lite.ts
import { localOwner, recordRoutes } from '@zephyrex/lite';
import { taskSpec } from '~/lib/appRecords';

export const { GET, PUT, DELETE } = recordRoutes(taskSpec, localOwner);
```

A `ResourceSpec` names the resource, its plural and its framework model name. It gives the zod
schemas for create and update, and the storage calls (`list`, `find`, `insert`,
`updateIfCurrent`, `remove`, `fields`), usually over Prisma.

The second argument decides whose records a request sees:

- **`localOwner`** is for a one-person app with no accounts. Every record belongs to
  `LOCAL_OWNER_ID`. A write must come from the app's own pages (`Sec-Fetch-Site`) and be JSON.
  A route that takes a file's own bytes, such as an upload, names the media types it reads instead:
  `localOwner(request, ['image/png', 'application/pdf'])`. Any other type is refused with a 415 that
  lists them. Read such a body with `readBytes(request, maxBytes)`, which refuses with a 413 past the
  route's cap.
- **Your own `OwnerResolver`** (`(request) => Owner | Promise<Owner>`) is for an app with
  accounts, e.g. a session check. It throws `ApiError(401)` to refuse a request.

## One catch-all for many resources

An app, or a suite package another app composes (the wiki inside rpg-ai), can describe its routes
as a table and serve them all from one catch-all, `app/api/v1/[...path]/route.lite.ts`:

```typescript
import { crudRoutes, localOwner, mergeRoutes, mountRoutes, type RouteTable } from '@zephyrex/lite';

const appRoutes: RouteTable = {
  task: crudRoutes(taskSpec, localOwner),
  report: { collection: { POST: makeReport }, actions: { latest: { GET: latestReport } } },
};
export const { GET, POST, PUT, PATCH, DELETE } = mountRoutes(mergeRoutes(wikiRoutes, appRoutes));
```

Each resource has `collection` (`/v1/task`), `record` (`/v1/task/{id}`, the id in `params`),
named `actions` (`/v1/task/of`, matched before an id) and `recordActions`
(`/v1/kit/{id}/apply`). Anything else is the framework's 404. Next serves the app's own specific
routes first, so its `/v1/extension` still wins. `mergeRoutes` refuses a resource two tables both
answer. A catch-all named otherwise (`[...wiki]`) passes `mountRoutes(table, { param: 'wiki' })`.

## Exports

- Handlers: `collectionRoutes`, `recordRoutes`, and the types `ResourceSpec`, `RecordRow`,
  `Owner` and `OwnerResolver`.
- Owners: `localOwner` and `LOCAL_OWNER_ID`.
- Shapes: `toDto`, `frameworkTimestamp`, `notFound`, and `parseBody` (a route's own body, unwrapped and refused as the handlers do).
- Errors: `ApiError`, `apiErrorResponse`, `recordError`, `validationError`, and the type
  `ErrorDetail`.
- Preconditions: `entityTag`, `evaluateIfMatch` and `nextUpdateStamp`.
- Catch-all: `mountRoutes`, `mergeRoutes`, `crudRoutes`, `routeFor`, and the types `RouteTable`,
  `ResourceRoutes`, `RouteMethods`, `RouteHandler`, `RouteMethod`, `CatchAllHandler` and `MountOptions`.
- Bodies: `readJsonObject`, `readBytes`, `requiredString`, `optionalString` and `MAX_BODY_BYTES`.

## License

AGPL-3.0-or-later
