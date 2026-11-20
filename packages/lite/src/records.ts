// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The lite variant's records, answered exactly as server-framework's generated CRUD
 * routes answer them (captured from the SaaS server; see docs/FEATURES.md):
 *
 * - list `GET /v1/<resource>` → `{ <resources>: [...], pagination }` with a weak ETag;
 * - create `POST` `{ <resource>: {...} }` → `201 { <resource> }` with its ETag;
 * - read `GET /v1/<resource>/{id}` → `{ <resource>, _links }` with its ETag;
 * - update `PUT` → `{ <resource> }`, needing `If-Match` (`428`), stale is `412` with `current`;
 * - delete `DELETE` → `204`, needing `If-Match` the same way.
 *
 * Every record belongs to the owner the app's resolver names (`localOwner` for a one-person
 * lite app, or the app's own session check), and one that isn't theirs is `404`. A record's
 * version (its ETag) is its `updated_at`, written the framework's way.
 */
import { createHash } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server.js';
import type { z } from 'zod';
import { ApiError, apiErrorResponse, recordError, validationError } from './apiErrors';
import { entityTag, evaluateIfMatch, nextUpdateStamp } from './conditionalRequest';
import { readJsonObject } from './requestBody';
import { STATUS } from './status';

/** The framework's list window when the caller names none. */
const DEFAULT_LIST_LIMIT = 1000;
const LIST_ETAG_HEX_LENGTH = 16;
const MICROSECOND_PADDING = '000';

/** Whom a request acts for: every record it reads or writes is that owner's. */
export interface Owner {
  id: string;
}

/**
 * Finds the request's owner, or throws an `ApiError` (401, 403, 415) to refuse it. A one-person
 * lite app passes `localOwner`; an app with accounts passes its session check.
 */
export type OwnerResolver = (request: NextRequest) => Owner | Promise<Owner>;

/** A row every record has, as Prisma reads it. */
export interface RecordRow {
  id: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  updatedById: string | null;
}

/** How one resource is stored and shaped; the handlers are the same for every resource. */
export interface ResourceSpec<Row extends RecordRow, Create, Update> {
  /** The singular name in paths and bodies (e.g. `task`). */
  resource: string;
  /** The plural the list answers with (e.g. `tasks`). */
  plural: string;
  /** The framework's model name, which its not-found answer names (e.g. `TaskModel`). */
  modelName: string;
  createSchema: z.ZodType<Create>;
  updateSchema: z.ZodType<Update>;
  /**
   * The owner's records. `query` is the request's search parameters, for the filters the
   * framework's list route takes as query fields (e.g. `?chat_id=…`). The window
   * (`offset`, `limit`) is applied by the handler.
   */
  list: (ownerId: string, query: URLSearchParams) => Promise<Row[]>;
  find: (id: string, ownerId: string) => Promise<Row | null>;
  insert: (ownerId: string, input: Create, stamp: Date) => Promise<Row>;
  /** Applies `input` only if the row is still at `version`; null when it moved on. */
  updateIfCurrent: (id: string, version: Date, input: Update, stamp: Date, userId: string) => Promise<Row | null>;
  remove: (id: string) => Promise<void>;
  /** The record's own fields (the common ones are added by `toDto`). */
  fields: (row: Row) => Record<string, unknown>;
  /** A check before creating, e.g. one record per user. */
  beforeCreate?: (ownerId: string) => Promise<void>;
}

/** A timestamp as the framework serialises it: naive UTC with microseconds. */
export function frameworkTimestamp(date: Date): string {
  return `${date.toISOString().slice(0, -1)}${MICROSECOND_PADDING}`;
}

/** What a record answers with: the spec's own fields and the framework's common ones. */
export type RecordDto = Record<string, unknown> & {
  id: string;
  created_at: string;
  created_by_user_id: string;
  updated_at: string;
  updated_by_user_id: string | null;
};

/** The part of a spec that renders a row (so any spec, whatever it creates and updates, will do). */
type RowFields<Row extends RecordRow> = Pick<ResourceSpec<Row, never, never>, 'fields'>;

export function toDto<Row extends RecordRow>(spec: RowFields<Row>, row: Row): RecordDto {
  return {
    ...spec.fields(row),
    id: row.id,
    created_at: frameworkTimestamp(row.createdAt),
    created_by_user_id: row.createdById,
    updated_at: frameworkTimestamp(row.updatedAt),
    updated_by_user_id: row.updatedById,
  };
}

function versionTag(row: RecordRow): string {
  return entityTag(frameworkTimestamp(row.updatedAt));
}

function parse<T>(schema: z.ZodType<T>, envelope: object, resource: string): T {
  const body: unknown = Reflect.get(envelope, resource);
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw validationError(`A ${resource} object is required`, resource);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(STATUS.UNPROCESSABLE, {
      message: 'Validation error',
      code: 'validation_error',
      errors: parsed.error.issues.map((issue) => ({ loc: issue.path.map(String), msg: issue.message })),
    });
  }
  return parsed.data;
}

/** The framework's answer for a record that isn't there (or isn't the caller's). */
export function notFound(modelName: string): ApiError {
  return recordError(STATUS.NOT_FOUND, `Request searched ${modelName} and could not find the required record.`);
}

/** The window a list request names (`offset`, `limit`), as the framework reads them. */
function listWindow(request: NextRequest): { offset: number; limit: number } {
  const read = (name: string, fallback: number): number => {
    const raw = request.nextUrl.searchParams.get(name);
    if (raw === null) {
      return fallback;
    }
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
      throw validationError(`${name} must be a whole number`, name);
    }
    return value;
  };
  return { offset: read('offset', 0), limit: read('limit', DEFAULT_LIST_LIMIT) };
}

type Handler = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

/** `GET` and `POST` on the collection, as `owner` sees it. */
export function collectionRoutes<Row extends RecordRow, Create, Update>(
  spec: ResourceSpec<Row, Create, Update>,
  owner: OwnerResolver,
): { GET: Handler; POST: Handler } {
  return {
    async GET(request) {
      try {
        const user = await owner(request);
        const { offset, limit } = listWindow(request);
        const rows = await spec.list(user.id, request.nextUrl.searchParams);
        const page = rows.slice(offset, offset + limit);
        const body = {
          [spec.plural]: page.map((row) => toDto(spec, row)),
          pagination: { offset, limit, total: rows.length, has_more: offset + page.length < rows.length },
        };
        const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, LIST_ETAG_HEX_LENGTH);
        return NextResponse.json(body, { headers: { ETag: `W/"${hash}"` } });
      } catch (error) {
        return apiErrorResponse(error);
      }
    },
    async POST(request) {
      try {
        const user = await owner(request);
        const input = parse(spec.createSchema, await readJsonObject(request), spec.resource);
        await spec.beforeCreate?.(user.id);
        const row = await spec.insert(user.id, input, new Date());
        return NextResponse.json(
          { [spec.resource]: toDto(spec, row) },
          { status: STATUS.CREATED, headers: { ETag: versionTag(row) } },
        );
      } catch (error) {
        return apiErrorResponse(error);
      }
    },
  };
}

/** Reads the request's `If-Match` against the row: `428` without one; the stale answer otherwise. */
function precondition<Row extends RecordRow>(spec: RowFields<Row>, request: NextRequest, row: Row): NextResponse | null {
  const result = evaluateIfMatch(request.headers.get('if-match'), frameworkTimestamp(row.updatedAt));
  if (result === 'absent') {
    throw new ApiError(STATUS.PRECONDITION_REQUIRED, 'If-Match required');
  }
  if (result === 'mismatch') {
    return stale(spec, row);
  }
  return null;
}

function stale<Row extends RecordRow>(spec: RowFields<Row>, row: Row): NextResponse {
  return NextResponse.json(
    { detail: 'The record was changed since it was read', current: toDto(spec, row) },
    { status: STATUS.PRECONDITION_FAILED, headers: { ETag: versionTag(row) } },
  );
}

/** `GET`, `PUT` and `DELETE` on one record (`[id]`), as `owner` sees it. */
export function recordRoutes<Row extends RecordRow, Create, Update>(
  spec: ResourceSpec<Row, Create, Update>,
  owner: OwnerResolver,
): { GET: Handler; PUT: Handler; DELETE: Handler } {
  const owned = async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const user = await owner(request);
    const { id } = await context.params;
    const row = await spec.find(id, user.id);
    if (row === null) {
      throw notFound(spec.modelName);
    }
    return { user, row };
  };
  return {
    async GET(request, context) {
      try {
        const { row } = await owned(request, context);
        const base = `/v1/${spec.resource}`;
        return NextResponse.json(
          {
            [spec.resource]: toDto(spec, row),
            _links: { self: { href: `${base}/${row.id}` }, collection: { href: base } },
          },
          { headers: { ETag: versionTag(row) } },
        );
      } catch (error) {
        return apiErrorResponse(error);
      }
    },
    async PUT(request, context) {
      try {
        const { user, row } = await owned(request, context);
        const refused = precondition(spec, request, row);
        if (refused !== null) {
          return refused;
        }
        const input = parse(spec.updateSchema, await readJsonObject(request), spec.resource);
        const updated = await spec.updateIfCurrent(row.id, row.updatedAt, input, nextUpdateStamp(row.updatedAt), user.id);
        if (updated === null) {
          const current = await spec.find(row.id, user.id);
          if (current === null) {
            throw notFound(spec.modelName);
          }
          return stale(spec, current);
        }
        return NextResponse.json({ [spec.resource]: toDto(spec, updated) }, { headers: { ETag: versionTag(updated) } });
      } catch (error) {
        return apiErrorResponse(error);
      }
    },
    async DELETE(request, context) {
      try {
        const { row } = await owned(request, context);
        const refused = precondition(spec, request, row);
        if (refused !== null) {
          return refused;
        }
        await spec.remove(row.id);
        return new NextResponse(null, { status: STATUS.NO_CONTENT });
      } catch (error) {
        return apiErrorResponse(error);
      }
    },
  };
}
