// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's attachments extension holds and accepts (server-framework
// extensions/attachments/BLL_Attachments.py): an asset is an uploaded file; an attachment ties one to
// a record by type, id and role.
import { z } from 'zod';

export const ASSET_ENDPOINT = '/v1/asset';
export const ATTACHMENT_ENDPOINT = '/v1/attachment';

/** The largest file the server accepts: a picture or a short document. */
export const MAX_ASSET_BYTES = 10_485_760; // 10 MiB
/** The longest file name it keeps. */
export const MAX_ASSET_NAME = 200;
/** What it accepts: pictures and PDFs. */
export const ASSET_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
/** A role is a short snake_case name: primary_image, header_image, gallery, document… */
export const ROLE_PATTERN = /^[a-z][a-z\d_]{0,39}$/;
/** The role a record's own picture takes. */
export const PRIMARY_IMAGE = 'primary_image';

const BYTES_PER_MB = 1_048_576;

export const AssetSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  content_type: z.string(),
  size: z.number(),
  sha256: z.string(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const AttachmentSchema = z.looseObject({
  id: z.string(),
  asset_id: z.string(),
  target_entity_type: z.string(),
  target_entity_id: z.string(),
  role: z.string(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  created_by_user_id: z.string().nullish(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

/** A record by the server's name for its type (`location` for LocationModel) and its id. */
export interface RecordRef {
  type: string;
  id: string;
}

/** Where a file's bytes are read: its uploader, or anyone who can view a record it is attached to. */
export const assetContentPath = (assetId: string): string => `${ASSET_ENDPOINT}/${encodeURIComponent(assetId)}/content`;

/** Whether a file of this media type shows as a picture. */
export const isPicture = (contentType: string): boolean => contentType.startsWith('image/');

/** Why the server would refuse `file`, in its words; null when it would take it. */
export function uploadProblem(file: File): string | null {
  if (!ASSET_TYPES.includes(file.type)) {
    return 'Upload a picture or a PDF';
  }
  if (file.size === 0) {
    return 'The file is empty';
  }
  if (file.size > MAX_ASSET_BYTES) {
    return `A file may be at most ${MAX_ASSET_BYTES / BYTES_PER_MB} MB`;
  }
  return null;
}

/** A file's name as the server keeps it: trimmed, at most its length, never empty. */
export function assetName(file: File): string {
  return file.name.trim().slice(0, MAX_ASSET_NAME) || 'file';
}

/** The newest attachment in `role`, as the server lists them (oldest first); null when there is none. */
export function newestIn(attachments: readonly Attachment[], role: string): Attachment | null {
  return attachments.filter((one) => one.role === role).at(-1) ?? null;
}
