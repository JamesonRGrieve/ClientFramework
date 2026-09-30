// SPDX-License-Identifier: AGPL-3.0-or-later
// Completes dist/ after tsc + tsc-alias:
//   - marks it as ES modules, so Node loads dist/**/*.js as ESM while the app's own
//     CommonJS config files (next.config.js, postcss.config.js, server-wrapper.js) stay as they are;
//   - ships the design-system stylesheet as dist/styles/zephyrex.css (export `zephyrex/styles.css`).
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('dist');

writeFileSync(resolve(DIST, 'package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
mkdirSync(resolve(DIST, 'styles'), { recursive: true });
copyFileSync(resolve('src/styles/zephyrex.css'), resolve(DIST, 'styles/zephyrex.css'));
console.warn('[finish-dist] wrote dist/package.json (type: module) and dist/styles/zephyrex.css');
