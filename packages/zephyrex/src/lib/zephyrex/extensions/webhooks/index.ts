// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const webhooksExtension = createExtension('webhooks', {
  description: 'Outbound webhook event delivery',
});
