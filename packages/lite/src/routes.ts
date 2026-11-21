// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * A lite API behind one catch-all route. A suite package (a product another app composes, such as
 * the wiki inside rpg-ai) exports its route table; the app merges it with its own and mounts the
 * result at `app/api/v1/[...path]/route.lite.ts`:
 *
 *   export const { GET, POST, PUT, PATCH, DELETE } = mountRoutes(mergeRoutes(wikiRoutes, appRoutes));
 *
 * Next serves an app's own specific routes before the catch-all, so its /v1/extension or anything
 * else it answers itself still wins. Lifted from zephyrex-rpg-wiki's `wikiLite` (2026-11-21).
 */
import type { NextRequest, NextResponse } from 'next/server.js';
import { apiErrorResponse } from './apiErrors';
import { collectionRoutes, notFound, type OwnerResolver, type RecordRow, recordRoutes, type ResourceSpec } from './records';

export type RouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** A handler as a Next route answers, its `params` holding `id` for a record's path. */
export type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;
export type RouteMethods = Partial<Record<RouteMethod, RouteHandler>>;

/**
 * One resource's routes: `/v1/<resource>` (collection), `/v1/<resource>/<id>` (record), its named
 * actions `/v1/<resource>/<action>` (matched before an id: `record_metadata/of`), and its record
 * actions `/v1/<resource>/<id>/<action>` (`property_kit/<id>/apply`).
 */
export interface ResourceRoutes {
  collection?: RouteMethods;
  record?: RouteMethods;
  actions?: Readonly<Record<string, RouteMethods>>;
  recordActions?: Readonly<Record<string, RouteMethods>>;
}

/** Every resource a catch-all answers, by its path segment (`campaign`, `record_metadata`). */
export type RouteTable = Readonly<Record<string, ResourceRoutes>>;

/** A resource's list and create, and its read, update and delete, as `collectionRoutes` and `recordRoutes` answer them. */
export function crudRoutes<Row extends RecordRow, Create, Update>(
  spec: ResourceSpec<Row, Create, Update>,
  owner: OwnerResolver,
): ResourceRoutes {
  return { collection: collectionRoutes(spec, owner), record: recordRoutes(spec, owner) };
}

/** Several tables as one; a resource path in two of them is an error, never a silent override. */
export function mergeRoutes(...tables: readonly RouteTable[]): RouteTable {
  const merged: Record<string, ResourceRoutes> = {};
  for (const table of tables) {
    for (const [path, routes] of Object.entries(table)) {
      if (Object.hasOwn(merged, path)) {
        throw new Error(`Two route tables both answer /v1/${path}`);
      }
      merged[path] = routes;
    }
  }
  return merged;
}

// Own keys only: "constructor" and the like are not routes.
const own = <T>(table: Readonly<Record<string, T>> | undefined, key: string | undefined): T | undefined =>
  table !== undefined && key !== undefined && Object.hasOwn(table, key) ? table[key] : undefined;

/** The longest path a table answers: a resource, an id, and a record action. */
const MAX_SEGMENTS = 3;

/** The handler for a path under /v1 and the id it names, if the table has one. */
export function routeFor(
  table: RouteTable,
  path: readonly string[],
  method: RouteMethod,
): { handler: RouteHandler | undefined; id: string | undefined } {
  const none = { handler: undefined, id: undefined };
  const routes = own(table, path[0]);
  if (routes === undefined || path.length > MAX_SEGMENTS) {
    return none;
  }
  const [, second = '', third = ''] = path;
  if (path.length === 1) {
    return { handler: routes.collection?.[method], id: undefined };
  }
  if (path.length === MAX_SEGMENTS) {
    return { handler: own(routes.recordActions, third)?.[method], id: second };
  }
  const action = own(routes.actions, second);
  return action === undefined
    ? { handler: routes.record?.[method], id: second }
    : { handler: action[method], id: undefined };
}

/** A Next catch-all handler: the route's params hold the path segments under the catch-all's name. */
export type CatchAllHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string[] | undefined>> },
) => Promise<NextResponse>;

export interface MountOptions {
  /** The catch-all segment's name, as in `[...path]` (the default) or `[...wiki]`. */
  param?: string;
}

/**
 * The catch-all route's handlers, one per method, answering each path from `table` and anything
 * else with the framework's 404 (`notFound`), as the SaaS server answers an unknown resource.
 */
export function mountRoutes(table: RouteTable, { param = 'path' }: MountOptions = {}): Record<RouteMethod, CatchAllHandler> {
  const answer =
    (method: RouteMethod): CatchAllHandler =>
    async (request, context) => {
      const path = (await context.params)[param] ?? [];
      const { handler, id } = routeFor(table, path, method);
      if (handler === undefined) {
        return apiErrorResponse(notFound(path[0] ?? 'Resource'));
      }
      const params: Record<string, string> = id === undefined ? {} : { id };
      return handler(request, { params: Promise.resolve(params) });
    };
  return { GET: answer('GET'), POST: answer('POST'), PUT: answer('PUT'), PATCH: answer('PATCH'), DELETE: answer('DELETE') };
}
