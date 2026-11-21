// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's attachments extension: upload a picture or PDF, attach it to any
// record in a role, and show a record's picture.
export { useAssetUpload, useAttachmentActions, useAttachments } from './attachmentsApi';
export type { AttachmentActions } from './attachmentsApi';
export {
  ASSET_ENDPOINT,
  ASSET_TYPES,
  AssetSchema,
  AssetSummarySchema,
  assetContentPath,
  assetName,
  ATTACHMENT_ENDPOINT,
  AttachmentSchema,
  fileSize,
  GALLERY,
  isPicture,
  MAX_ASSET_BYTES,
  MAX_ASSET_NAME,
  newestIn,
  PRIMARY_IMAGE,
  ROLE_PATTERN,
  uploadProblem,
} from './attachmentsModel';
export type { Asset, AssetSummary, Attachment, RecordRef } from './attachmentsModel';
export { AttachmentGallery } from './AttachmentGallery';
export type { AttachmentGalleryProps } from './AttachmentGallery';
export { attachmentsExtension } from './extension';
export { FilePicker } from './FilePicker';
export type { FilePickerProps } from './FilePicker';
export { RecordPicture } from './RecordPicture';
export type { RecordPictureProps } from './RecordPicture';
