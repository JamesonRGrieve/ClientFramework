// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// Abilities only, run server side; its providers are configured on the provider pages.
export const mediaExtension = createExtension('media', {
  displayName: 'Media',
  description: 'Film, television and video lookups through YouTube and TMDB',
});
