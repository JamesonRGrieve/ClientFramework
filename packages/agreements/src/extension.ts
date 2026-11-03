// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { agreementsExtension as registered } from 'zephyrex/extensions';
import { AgreementsPage } from './AgreementsPage';
import { AGREEMENTS_PATH } from './routes';

/** Agreements as the extension mounts them: an app that knows people mounts its own, passing them. */
export function AgreementsRoute(): ReactElement {
  return createElement(AgreementsPage);
}

/** The agreements client extension with its page and menu entry, for an app's `extensions`. */
export const agreementsExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [{ path: AGREEMENTS_PATH, component: AgreementsRoute }],
  navItems: [{ title: 'Agreements', url: AGREEMENTS_PATH }],
};
