// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { genealogyExtension as registered } from 'zephyrex/extensions/genealogy';
import { GenealogyPage } from './GenealogyPage';
import { PersonPage } from './PersonPage';
import { GENEALOGY_PATH } from './routes';

/** The genealogy client extension with its pages and menu entry, for an app's `extensions`. */
export const genealogyExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: GENEALOGY_PATH, component: GenealogyPage },
    { path: `${GENEALOGY_PATH}/:personId`, component: PersonPage },
  ],
  navItems: [{ title: 'Family Tree', url: GENEALOGY_PATH }],
};
