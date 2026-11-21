// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/attachments', () => {
  it('publishes the reads and writes, the model, the picker, the record picture and the extension', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'ASSET_ENDPOINT',
        'ASSET_TYPES',
        'ATTACHMENT_ENDPOINT',
        'AssetSchema',
        'AssetSummarySchema',
        'AttachmentGallery',
        'AttachmentSchema',
        'FilePicker',
        'GALLERY',
        'MAX_ASSET_BYTES',
        'MAX_ASSET_NAME',
        'PRIMARY_IMAGE',
        'ROLE_PATTERN',
        'RecordPicture',
        'assetContentPath',
        'assetName',
        'attachmentsExtension',
        'fileSize',
        'isPicture',
        'newestIn',
        'uploadProblem',
        'useAssetUpload',
        'useAttachmentActions',
        'useAttachments',
      ].sort(),
    );
  });
});
