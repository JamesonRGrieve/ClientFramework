// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const quotaExtension: ZephyrexClientExtension = {
  name: 'quota',
  displayName: 'Usage Quotas',
  description: 'Rate limiting and usage cap enforcement',
  serverExtension: 'quota',
  // Quota warnings surface via API error responses (429).
  // A usage dashboard could be added as a page.
};
