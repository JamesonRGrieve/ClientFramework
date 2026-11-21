// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse, useSWRConfig } from 'swr';
import { type Upload, type UploadRequest, useClient, useUpload } from 'zephyrex';
import { z } from 'zod';
import {
  ASSET_ENDPOINT,
  type Asset,
  AssetSchema,
  ATTACHMENT_ENDPOINT,
  type Attachment,
  AttachmentSchema,
  assetName,
  type RecordRef,
} from './attachmentsModel';

const OF = `${ATTACHMENT_ENDPOINT}/of`;

/** A file goes up as its own bytes, its type in Content-Type and its name in the query (POST /v1/asset/upload). */
const UPLOAD: UploadRequest<Asset> = {
  path: (file) => `${ASSET_ENDPOINT}/upload?name=${encodeURIComponent(assetName(file))}`,
  body: (file) => file,
  headers: (file) => ({ 'Content-Type': file.type }),
  answer: z.object({ asset: AssetSchema }).transform(({ asset }) => asset),
};

const ofParams = (target: RecordRef, role?: string): Record<string, string> => ({
  target_entity_type: target.type,
  target_entity_id: target.id,
  ...(role === undefined ? {} : { role }),
});

/** Uploads a picture or PDF as the signed-in user's asset, with progress. */
export function useAssetUpload(): Upload<Asset> {
  return useUpload(UPLOAD);
}

/** A record's attachments (oldest first), optionally in one role; nothing until there is a record. */
export function useAttachments(target: RecordRef | null, role?: string): SWRResponse<Attachment[], Error> {
  const client = useClient();
  const params = target === null ? null : ofParams(target, role);
  return useSWR<Attachment[], Error>(
    params === null ? null : client.url(OF, params),
    async () => z.object({ attachments: z.array(AttachmentSchema) }).parse(await client.get(OF, params ?? {})).attachments,
  );
}

export interface AttachmentActions {
  /** Uploads `file` and attaches it to the record in `role`; null when the upload failed (see `upload.error`). */
  attachFile: (file: File, role: string) => Promise<Attachment | null>;
  /** As `attachFile`, then removes what was in `role` before: a record's one picture, replaced. */
  replaceFile: (file: File, role: string, previous: readonly Attachment[]) => Promise<Attachment | null>;
  /** Attaches one of the user's own assets in `role`. */
  attach: (assetId: string, role: string) => Promise<Attachment>;
  /** Takes an attachment off the record (the asset stays the uploader's). */
  remove: (attachment: Attachment) => Promise<void>;
  /** The upload's progress and last error. */
  upload: Upload<Asset>;
}

/** The writes to a record's attachments, each refreshing every list of them. */
export function useAttachmentActions(target: RecordRef): AttachmentActions {
  const client = useClient();
  const { mutate } = useSWRConfig();
  const upload = useAssetUpload();
  const refresh = useCallback(async (): Promise<void> => {
    const base = client.url(OF, ofParams(target));
    await mutate((key) => typeof key === 'string' && key.startsWith(base));
  }, [client, mutate, target]);
  const link = useCallback(
    async (assetId: string, role: string): Promise<Attachment> => {
      const body = { attachment: { asset_id: assetId, target_entity_type: target.type, target_entity_id: target.id, role } };
      return z.object({ attachment: AttachmentSchema }).parse(await client.post(ATTACHMENT_ENDPOINT, body)).attachment;
    },
    [client, target],
  );
  const unlink = useCallback(
    async (attachment: Attachment): Promise<void> => {
      await client.delete(`${ATTACHMENT_ENDPOINT}/${encodeURIComponent(attachment.id)}`, attachment);
    },
    [client],
  );
  const attach = useCallback(
    async (assetId: string, role: string): Promise<Attachment> => {
      const made = await link(assetId, role);
      await refresh();
      return made;
    },
    [link, refresh],
  );
  const { upload: send } = upload;
  const attachFile = useCallback(
    async (file: File, role: string): Promise<Attachment | null> => {
      const asset = await send(file);
      return asset === null ? null : attach(asset.id, role);
    },
    [send, attach],
  );
  const replaceFile = useCallback(
    async (file: File, role: string, previous: readonly Attachment[]): Promise<Attachment | null> => {
      const asset = await send(file);
      if (asset === null) {
        return null;
      }
      const made = await link(asset.id, role);
      await Promise.all(previous.filter((one) => one.role === role).map(unlink));
      await refresh();
      return made;
    },
    [send, link, unlink, refresh],
  );
  const remove = useCallback(
    async (attachment: Attachment): Promise<void> => {
      await unlink(attachment);
      await refresh();
    },
    [unlink, refresh],
  );
  return { attachFile, replaceFile, attach, remove, upload };
}
