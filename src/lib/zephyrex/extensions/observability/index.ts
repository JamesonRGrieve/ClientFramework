// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const observabilityExtension = createExtension('observability', {
  displayName: 'Observability',
  description: 'Metrics backend and error-reporter status',
});
