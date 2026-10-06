// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { aiChainsExtension as registered } from 'zephyrex/extensions';
import { ChainPage } from './ChainPage';
import { ChainsPage } from './ChainsPage';
import { CHAINS_PATH } from './routes';

/** The AI chains client extension with its pages and menu entry, for an app's `extensions`. */
export const aiChainsExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: CHAINS_PATH, component: ChainsPage },
    { path: `${CHAINS_PATH}/:chainId`, component: ChainPage },
  ],
  navItems: [{ title: 'Chains', url: CHAINS_PATH }],
};
