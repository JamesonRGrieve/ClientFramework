// SPDX-License-Identifier: AGPL-3.0-or-later
import { globSync } from 'fs';

/** Every source tree the scans cover: the template app's `src`, and each workspace package's. */
export const SOURCE_ROOTS: readonly string[] = ['src', ...globSync('packages/*/src').sort()];
