// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement, type ReactNode } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { genealogyExtension as registered } from 'zephyrex/extensions/genealogy';
import { GenealogyPage } from './GenealogyPage';
import { FAMILY_TREE, type GenealogyOptions } from './options';
import { GenealogyOptionsProvider } from './OptionsProvider';
import { PersonPage } from './PersonPage';
import { GENEALOGY_PATH } from './routes';

/**
 * The genealogy client extension with its pages and menu entry, its tree named and its sections
 * chosen by `options` (a family tree when omitted), for an app's `extensions`.
 */
export function createGenealogyExtension(options: Partial<GenealogyOptions> = {}): ZephyrexClientExtension {
  const named = { ...FAMILY_TREE, ...options };
  // Renders the client provider rather than calling into it, so the config can be built on the server.
  const Options = ({ children }: { children: ReactNode }): ReactElement =>
    createElement(GenealogyOptionsProvider, { options: named }, children);
  return {
    ...registered,
    pages: [
      { path: GENEALOGY_PATH, component: GenealogyPage },
      { path: `${GENEALOGY_PATH}/:personId`, component: PersonPage },
    ],
    navItems: [{ title: named.tree, url: GENEALOGY_PATH }],
    providers: [Options],
  };
}

/** The genealogy client extension as a family tree. */
export const genealogyExtension: ZephyrexClientExtension = createGenealogyExtension();
