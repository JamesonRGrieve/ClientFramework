// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory /v1/asset and /v1/attachment for the package's tests and stories (never compiled into
// dist), with the server's rules: one attaches one's own asset to a record one may edit; anyone who
// may view a record lists its attachments (oldest first); a record one may not view reads as missing.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import type { Asset, Attachment, RecordRef } from './attachmentsModel';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
/** When the store's clock starts: each write is a second after the one before. */
const EPOCH = Date.parse('2026-11-21T12:00:00Z');
const MS_PER_SECOND = 1000;
const SHA256_HEX_LENGTH = 64;

/** A 2×2 PNG in a violet: what every picture's content route answers here. */
const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGPI9boGRAwQCgAp1gY1dFvwPAAAAABJRU5ErkJggg=='),
  (char) => char.charCodeAt(0),
);

/** What the mock server holds. */
export interface AttachmentStore {
  assets: Asset[];
  attachments: Attachment[];
  /** Records the user may view, as `type:id`. */
  viewable: Set<string>;
  /** Records the user may edit, as `type:id` (each also viewable). */
  editable: Set<string>;
  /** Counts each write, for unique ids and ordered timestamps. */
  clock: number;
}

const keyOf = (type: string, id: string): string => `${type}:${id}`;

/** The location "terra" the user may edit, and the location "far-moon" they may only view. */
export const TERRA: RecordRef = { type: 'location', id: 'terra' };
export const FAR_MOON: RecordRef = { type: 'location', id: 'far-moon' };

export const emptyAttachmentStore = (): AttachmentStore => ({
  assets: [],
  attachments: [],
  viewable: new Set([keyOf(TERRA.type, TERRA.id), keyOf(FAR_MOON.type, FAR_MOON.id)]),
  editable: new Set([keyOf(TERRA.type, TERRA.id)]),
  clock: 0,
});

const stamp = (store: AttachmentStore): string => {
  store.clock += 1;
  return new Date(EPOCH + store.clock * MS_PER_SECOND).toISOString();
};

/** Stores an uploaded file as the server would, answering what its upload route answers. */
export function storeAsset(store: AttachmentStore, name: string, contentType: string, size: number): Asset {
  const asset: Asset = {
    id: `asset-${store.clock + 1}`,
    name,
    content_type: contentType,
    size,
    sha256: '0'.repeat(SHA256_HEX_LENGTH),
    created_at: stamp(store),
  };
  store.assets.push(asset);
  return asset;
}

/** Attaches a stored asset as the server would. */
export function storeAttachment(store: AttachmentStore, asset: Asset, target: RecordRef, role: string): Attachment {
  const attachment: Attachment = {
    id: `attachment-${store.clock + 1}`,
    asset_id: asset.id,
    target_entity_type: target.type,
    target_entity_id: target.id,
    role,
    created_at: stamp(store),
  };
  store.attachments.push(attachment);
  return attachment;
}

const notFound = (what: string): Response => HttpResponse.json({ detail: `${what} not found` }, { status: HTTP_NOT_FOUND });

const CreateBody = z.object({
  attachment: z.object({
    asset_id: z.string(),
    target_entity_type: z.string(),
    target_entity_id: z.string(),
    role: z.string(),
  }),
});

export function attachmentHandlers(store: AttachmentStore): RequestHandler[] {
  return [
    http.post('*/v1/asset/upload', async ({ request }) => {
      const bytes = await request.arrayBuffer();
      const name = new URL(request.url).searchParams.get('name') ?? 'file';
      const asset = storeAsset(store, name, request.headers.get('content-type') ?? '', bytes.byteLength);
      return HttpResponse.json({ asset }, { status: HTTP_CREATED });
    }),
    http.get('*/v1/asset/:assetId/content', () => new HttpResponse(PNG, { headers: { 'Content-Type': 'image/png' } })),
    http.get('*/v1/attachment/of', ({ request }) => {
      const query = new URL(request.url).searchParams;
      const type = query.get('target_entity_type') ?? '';
      const id = query.get('target_entity_id') ?? '';
      const role = query.get('role');
      if (!store.viewable.has(keyOf(type, id))) {
        return notFound('Record');
      }
      // As the server: each row with its file's name, type and size; a row whose file is gone is skipped.
      const attachments = store.attachments
        .filter(
          (one) => one.target_entity_type === type && one.target_entity_id === id && (role === null || one.role === role),
        )
        .flatMap((one) => {
          const file = store.assets.find((asset) => asset.id === one.asset_id);
          return file === undefined
            ? []
            : [{ ...one, asset: { name: file.name, content_type: file.content_type, size: file.size } }];
        });
      return HttpResponse.json({ attachments });
    }),
    http.post('*/v1/attachment', async ({ request }) => {
      const { attachment: wanted } = CreateBody.parse(await request.json());
      const asset = store.assets.find((one) => one.id === wanted.asset_id);
      if (asset === undefined) {
        return notFound('Asset');
      }
      if (!store.editable.has(keyOf(wanted.target_entity_type, wanted.target_entity_id))) {
        return notFound('Record');
      }
      const target = { type: wanted.target_entity_type, id: wanted.target_entity_id };
      return HttpResponse.json({ attachment: storeAttachment(store, asset, target, wanted.role) }, { status: HTTP_CREATED });
    }),
    http.delete('*/v1/attachment/:attachmentId', ({ params: { attachmentId } }) => {
      const at = store.attachments.findIndex((one) => one.id === attachmentId);
      if (at === -1) {
        return notFound('Attachment');
      }
      store.attachments.splice(at, 1);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
