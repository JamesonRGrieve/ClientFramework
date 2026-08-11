// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const metaLabelsExtension: ZephyrexClientExtension = {
  name: 'meta_labels',
  displayName: 'Labels',
  description: 'Tag and label management for entities',
  serverExtension: 'meta_labels',
  // Label CRUD via /v1/label API. Could add a tag picker component
  // that injects into entity detail pages via pageSlots.
};
