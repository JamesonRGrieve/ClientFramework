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
- **Your own `OwnerResolver`** (`(request) => Owner | Promise<Owner>`) is for an app with
  accounts, e.g. a session check. It throws `ApiError(401)` to refuse a request.

## Exports

- Handlers: `collectionRoutes`, `recordRoutes`, and the types `ResourceSpec`, `RecordRow`,
  `Owner` and `OwnerResolver`.
- Owners: `localOwner` and `LOCAL_OWNER_ID`.
- Shapes: `toDto`, `frameworkTimestamp` and `notFound`.
- Errors: `ApiError`, `apiErrorResponse`, `recordError`, `validationError`, and the type
  `ErrorDetail`.
- Preconditions: `entityTag`, `evaluateIfMatch` and `nextUpdateStamp`.
- Bodies: `readJsonObject`, `requiredString`, `optionalString` and `MAX_BODY_BYTES`.

## License

AGPL-3.0-or-later
