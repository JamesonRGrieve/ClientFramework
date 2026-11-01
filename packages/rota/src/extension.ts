// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { rotaExtension as registered } from 'zephyrex/extensions';
import { ROTA_PATH } from './routes';
import { RotaPage } from './RotaPage';

/** The rota page as the extension mounts it: an app that knows people mounts its own, passing them. */
export function RotaRoute(): ReactElement {
  return createElement(RotaPage);
}

/** The rota client extension with its page and menu entry, for an app's `extensions`: the nights rota. */
export const rotaExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [{ path: ROTA_PATH, component: RotaRoute }],
  navItems: [{ title: 'Nights rota', url: ROTA_PATH }],
};
