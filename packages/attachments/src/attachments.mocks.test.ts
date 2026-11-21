// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { attachmentHandlers, emptyAttachmentStore, FAR_MOON, storeAsset, TERRA } from './attachments.mocks';

const attach = (assetId: string, target: { type: string; id: string }): RequestInit => ({
  method: 'POST',
  body: JSON.stringify({
    attachment: { asset_id: assetId, target_entity_type: target.type, target_entity_id: target.id, role: 'gallery' },
  }),
});

const ATTACH_URL = 'http://x/v1/attachment';

describe('the attachments mock', () => {
  it('keeps the server’s rules: own asset, editable record, viewers list', async () => {
    const store = emptyAttachmentStore();
    const serve = fetchFrom(attachmentHandlers(store));
    const asset = storeAsset(store, 'a.png', 'image/png', 3);
    expect((await serve(ATTACH_URL, attach(asset.id, TERRA))).status).toBe(201);
    expect((await serve(ATTACH_URL, attach(asset.id, FAR_MOON))).status).toBe(404);
    expect((await serve(ATTACH_URL, attach('nobody', TERRA))).status).toBe(404);
    const listed = await serve('http://x/v1/attachment/of?target_entity_type=location&target_entity_id=terra');
    expect(((await listed.json()) as { attachments: unknown[] }).attachments).toHaveLength(1);
    const hidden = await serve('http://x/v1/attachment/of?target_entity_type=location&target_entity_id=nowhere');
    expect(hidden.status).toBe(404);
  });

  it('stores an upload and serves a picture', async () => {
    const store = emptyAttachmentStore();
    const serve = fetchFrom(attachmentHandlers(store));
    const uploaded = await serve('http://x/v1/asset/upload?name=b.png', {
      method: 'POST',
      body: new Uint8Array([1, 2, 3]),
      headers: { 'Content-Type': 'image/png' },
    });
    expect(uploaded.status).toBe(201);
    expect(store.assets).toMatchObject([{ name: 'b.png', content_type: 'image/png', size: 3 }]);
    const content = await serve(`http://x/v1/asset/${store.assets[0]?.id ?? ''}/content`);
    expect(content.headers.get('content-type')).toBe('image/png');
  });
});
