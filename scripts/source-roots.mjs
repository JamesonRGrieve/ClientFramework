// SPDX-License-Identifier: AGPL-3.0-or-later
// Every source tree the ratchets measure: the template app's `src`, and each workspace package's.
import { globSync } from 'node:fs';

export const SOURCE_ROOTS = ['src', ...globSync('packages/*/src').sort()];
