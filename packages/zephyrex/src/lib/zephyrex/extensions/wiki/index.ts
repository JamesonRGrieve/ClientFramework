// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// Abilities only, run server side; its providers are configured on the provider pages.
export const wikiExtension = createExtension('wiki', {
  displayName: 'Wiki',
  description: 'Wikipedia, Fandom and Kanka lookups for agents and other extensions',
});
