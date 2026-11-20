// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest } from 'next/server.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiError } from './apiErrors';
import {
  collectionRoutes,
  frameworkTimestamp,
  type OwnerResolver,
  type RecordRow,
  type ResourceSpec,
  recordRoutes,
} from './records';

/** A small resource kept in memory: a real store, so the handlers run end to end. */
interface NoteRow extends RecordRow {
  title: string;
}

const BASE = 'http://localhost/api/v1/note';
const OWNER = 'owner-1';
const STRANGER = 'owner-2';

function noteStore() {
  const rows = new Map<string, NoteRow>();
  let next = 0;
  const spec: ResourceSpec<NoteRow, { title: string }, { title?: string }> = {
    resource: 'note',
    plural: 'notes',
    modelName: 'NoteModel',
    createSchema: z.object({ title: z.string().min(1) }),
    updateSchema: z.object({ title: z.string().min(1).optional() }),
    list: async (ownerId, query) =>
      [...rows.values()].filter(
        (row) => row.createdById === ownerId && (query.get('title') === null || row.title === query.get('title')),
      ),
    find: async (id, ownerId) => {
      const row = rows.get(id);
      return row !== undefined && row.createdById === ownerId ? row : null;
    },
    insert: async (ownerId, input, stamp) => {
      next += 1;
      const row: NoteRow = {
        id: `note-${next}`,
        createdById: ownerId,
        createdAt: stamp,
        updatedAt: stamp,
        updatedById: null,
        title: input.title,
      };
      rows.set(row.id, row);
      return row;
    },
    updateIfCurrent: async (id, version, input, stamp, userId) => {
      const row = rows.get(id);
      if (row === undefined || row.updatedAt.getTime() !== version.getTime()) {
        return null;
      }
      const updated = { ...row, ...input, updatedAt: stamp, updatedById: userId };
      rows.set(id, updated);
      return updated;
    },
    remove: async (id) => {
      rows.delete(id);
    },
    fields: (row) => ({ title: row.title }),
  };
  return { rows, spec };
}

/** An owner resolver that, like a session check, answers asynchronously. */
const ownerAs =
  (id: string): OwnerResolver =>
  async () => ({ id });

const refuseAll: OwnerResolver = () => {
  throw new ApiError(401, 'No authentication provided.');
};

const JSON_HEADERS = { 'content-type': 'application/json' };

function call(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { ...JSON_HEADERS, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('collectionRoutes and recordRoutes', () => {
  let store: ReturnType<typeof noteStore>;
  let collection: ReturnType<typeof collectionRoutes<NoteRow, { title: string }, { title?: string }>>;
  let record: ReturnType<typeof recordRoutes<NoteRow, { title: string }, { title?: string }>>;

  beforeEach(() => {
    store = noteStore();
    collection = collectionRoutes(store.spec, ownerAs(OWNER));
    record = recordRoutes(store.spec, ownerAs(OWNER));
  });

  async function created(title = 'First'): Promise<{ id: string; etag: string }> {
    const response = await collection.POST(call('POST', BASE, { note: { title } }), params(''));
    const body = (await response.json()) as { note: { id: string } };
    return { id: body.note.id, etag: response.headers.get('etag') ?? '' };
  }

  it('creates a record with 201, its envelope and its version as the ETag', async () => {
    const response = await collection.POST(call('POST', BASE, { note: { title: 'First' } }), params(''));
    expect(response.status).toBe(201);
    const body = (await response.json()) as { note: Record<string, unknown> };
    const row = store.rows.get(String(body.note.id));
    expect(row).toBeDefined();
    expect(body.note).toMatchObject({ title: 'First', created_by_user_id: OWNER, updated_by_user_id: null });
    expect(response.headers.get('etag')).toBe(`"${frameworkTimestamp(row?.updatedAt ?? new Date())}"`);
  });

  it('takes a bare record without the envelope, as server-framework does', async () => {
    const response = await collection.POST(call('POST', BASE, { title: 'loose' }), params(''));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ note: { title: 'loose' } });
  });

  it('refuses an envelope whose record is not an object with 422', async () => {
    const response = await collection.POST(call('POST', BASE, { note: 'loose' }), params(''));
    expect(response.status).toBe(422);
  });

  it("lists only the owner's records, windowed, with a weak ETag", async () => {
    await created('One');
    await created('Two');
    await collectionRoutes(store.spec, ownerAs(STRANGER)).POST(
      call('POST', BASE, { note: { title: 'Theirs' } }),
      params(''),
    );
    const response = await collection.GET(call('GET', `${BASE}?offset=1&limit=1`), params(''));
    const body = (await response.json()) as { notes: { title: string }[]; pagination: Record<string, unknown> };
    expect(body.notes.map((note) => note.title)).toEqual(['Two']);
    expect(body.pagination).toEqual({ offset: 1, limit: 1, total: 2, has_more: false });
    expect(response.headers.get('etag')).toMatch(/^W\/"[\da-f]{16}"$/);
  });

  it("hands the list the request's query, for the framework's field filters", async () => {
    await created('One');
    await created('Two');
    const response = await collection.GET(call('GET', `${BASE}?title=Two`), params(''));
    const body = (await response.json()) as { notes: { title: string }[] };
    expect(body.notes.map((note) => note.title)).toEqual(['Two']);
  });

  it('reads one record with its links', async () => {
    const { id } = await created();
    const response = await record.GET(call('GET', `${BASE}/${id}`), params(id));
    const body = (await response.json()) as { _links: unknown };
    expect(body._links).toEqual({ self: { href: `/v1/note/${id}` }, collection: { href: '/v1/note' } });
  });

  it("answers another owner's record as not found", async () => {
    const { id } = await created();
    const response = await recordRoutes(store.spec, ownerAs(STRANGER)).GET(call('GET', `${BASE}/${id}`), params(id));
    expect(response.status).toBe(404);
  });

  it('needs If-Match to update (428), refuses a stale one (412 with current), and saves a current one', async () => {
    const { id, etag } = await created();
    const url = `${BASE}/${id}`;
    expect((await record.PUT(call('PUT', url, { note: { title: 'x' } }), params(id))).status).toBe(428);

    const stale = await record.PUT(
      call('PUT', url, { note: { title: 'x' } }, { 'if-match': '"1999-01-01T00:00:00.000000"' }),
      params(id),
    );
    expect(stale.status).toBe(412);
    expect(((await stale.json()) as { current: { title: string } }).current.title).toBe('First');

    const saved = await record.PUT(call('PUT', url, { note: { title: 'Second' } }, { 'if-match': etag }), params(id));
    expect(saved.status).toBe(200);
    expect(((await saved.json()) as { note: { title: string; updated_by_user_id: string } }).note).toMatchObject({
      title: 'Second',
      updated_by_user_id: OWNER,
    });
    expect(saved.headers.get('etag')).not.toBe(etag);
  });

  it('needs If-Match to delete, then answers 204', async () => {
    const { id, etag } = await created();
    const url = `${BASE}/${id}`;
    expect((await record.DELETE(call('DELETE', url), params(id))).status).toBe(428);
    expect((await record.DELETE(call('DELETE', url, undefined, { 'if-match': etag }), params(id))).status).toBe(204);
    expect(store.rows.has(id)).toBe(false);
  });

  it("answers with the resolver's refusal", async () => {
    const response = await collectionRoutes(store.spec, refuseAll).GET(call('GET', BASE), params(''));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: 'No authentication provided.' });
  });
});
