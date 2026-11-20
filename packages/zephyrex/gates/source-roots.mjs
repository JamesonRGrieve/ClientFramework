// SPDX-License-Identifier: AGPL-3.0-or-later
// Every source tree the ratchets measure, from where they run: `src`, and each workspace package's
// (client-framework), or just `src` (an app's client). `GATE_ROOTS=a,b` names them instead.
import { existsSync, globSync } from 'node:fs';

const named = process.env.GATE_ROOTS?.split(',')
  .map((root) => root.trim())
  .filter((root) => root !== '');

export const SOURCE_ROOTS = named ?? ['src', ...globSync('packages/*/src').sort()].filter((root) => existsSync(root));
