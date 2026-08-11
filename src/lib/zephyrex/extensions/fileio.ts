// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const fileioExtension: ZephyrexClientExtension = {
  name: 'fileio',
  displayName: 'File Storage',
  description: 'File upload and object storage',
  serverExtension: 'fileio',
  // The useFileUpload() hook from zephyrex handles file uploads
  // against the /v1/file endpoint provided by this extension.
};
