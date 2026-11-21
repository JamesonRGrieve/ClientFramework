// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server.js';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { RecordRow, ResourceSpec } from './records';
import { crudRoutes, mergeRoutes, mountRoutes, type RouteHandler, type RouteTable, routeFor } from './routes';

const HTTP_NOT_FOUND = 404;

/** A handler that answers which route it is and the id it was given. */
const named =
  (route: string): RouteHandler =>
  async (_request, context) => {
    const params = await context.params;
    return NextResponse.json({ route, id: Object.hasOwn(params, 'id') ? params.id : null });
  };

const TABLE: RouteTable = {
  kit: {
    collection: { GET: named('kit list'), POST: named('kit create') },
    record: { GET: named('kit read'), PATCH: named('kit patch') },
    actions: { of: { GET: named('kit of') } },
    recordActions: { apply: { POST: named('kit apply') } },
  },
};

const call = (method: string, path: string): NextRequest => new NextRequest(`http://localhost/api/v1/${path}`, { method });
const segments = (path: string): { params: Promise<Record<string, string[] | undefined>> } => ({
  params: Promise.resolve({ path: path.split('/') }),
});

describe('routeFor', () => {
  it('finds a collection, a record by id, a named action before an id, and a record action', () => {
    expect(routeFor(TABLE, ['kit'], 'GET').id).toBeUndefined();
    expect(routeFor(TABLE, ['kit', 'k1'], 'PATCH')).toMatchObject({ id: 'k1' });
    expect(routeFor(TABLE, ['kit', 'of'], 'GET')).toMatchObject({ id: undefined });
    expect(routeFor(TABLE, ['kit', 'k1', 'apply'], 'POST')).toMatchObject({ id: 'k1' });
  });

  it('finds nothing for an unknown resource, method, action or a longer path, or an inherited key', () => {
    for (const [path, method] of [
      [['nothing'], 'GET'],
      [['kit'], 'DELETE'],
      [['kit', 'k1', 'undo'], 'POST'],
      [['kit', 'k1', 'apply', 'more'], 'POST'],
      [['constructor'], 'GET'],
    ] as const) {
      expect(routeFor(TABLE, path, method).handler).toBeUndefined();
    }
  });
});

describe('mountRoutes', () => {
  it('answers each path from the table, with the id in the handler’s params', async () => {
    const { GET, POST } = mountRoutes(TABLE);
    expect(await (await GET(call('GET', 'kit/k1'), segments('kit/k1'))).json()).toEqual({ route: 'kit read', id: 'k1' });
    expect(await (await POST(call('POST', 'kit/k2/apply'), segments('kit/k2/apply'))).json()).toEqual({
      route: 'kit apply',
      id: 'k2',
    });
  });

  it('answers anything else with the framework’s 404, and reads a catch-all under another name', async () => {
    const missing = await mountRoutes(TABLE).GET(call('GET', 'nothing'), segments('nothing'));
    expect(missing.status).toBe(HTTP_NOT_FOUND);
    expect(await missing.json()).toEqual({
      detail: { message: 'Request searched nothing and could not find the required record.' },
    });
    const { GET } = mountRoutes(TABLE, { param: 'wiki' });
    const found = await GET(call('GET', 'kit'), { params: Promise.resolve({ wiki: ['kit'] }) });
    expect(await found.json()).toEqual({ route: 'kit list', id: null });
  });
});

describe('mergeRoutes and crudRoutes', () => {
  it('merges tables, and refuses a resource two of them answer', () => {
    const other: RouteTable = { campaign: { collection: { GET: named('campaigns') } } };
    expect(Object.keys(mergeRoutes(TABLE, other)).sort()).toEqual(['campaign', 'kit']);
    expect(() => mergeRoutes(TABLE, { kit: {} })).toThrow('Two route tables both answer /v1/kit');
  });

  it('gives a resource spec its collection and record handlers', () => {
    const spec: ResourceSpec<RecordRow, object, object> = {
      resource: 'kit',
      plural: 'kits',
      modelName: 'KitModel',
      createSchema: z.object({}),
      updateSchema: z.object({}),
      list: async () => Promise.resolve([]),
      find: async () => Promise.resolve(null),
      insert: async () => Promise.reject(new Error('not in this test')),
      updateIfCurrent: async () => Promise.resolve(null),
      remove: async () => Promise.resolve(),
      fields: () => ({}),
    };
    const routes = crudRoutes(spec, () => ({ id: 'owner' }));
    expect(Object.keys(routes.collection ?? {}).sort()).toEqual(['GET', 'POST']);
    expect(Object.keys(routes.record ?? {}).sort()).toEqual(['DELETE', 'GET', 'PUT']);
  });
});
