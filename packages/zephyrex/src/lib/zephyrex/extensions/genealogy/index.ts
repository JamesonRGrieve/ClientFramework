// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// The pages ship in @zephyrex/genealogy, which extends this entry.
export const genealogyExtension = createExtension('genealogy', {
  displayName: 'Genealogy',
  description: 'People, their relationships, family trees, kinship and GEDCOM import and export',
});
