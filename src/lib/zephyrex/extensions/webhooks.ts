// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const webhooksExtension: ZephyrexClientExtension = {
  name: 'webhooks',
  displayName: 'Webhooks',
  description: 'Outbound webhook event delivery',
  serverExtension: 'webhooks',
  // Webhook management could be added as a settings panel
  // for CRUD on webhook endpoints via /v1/webhook.
};
