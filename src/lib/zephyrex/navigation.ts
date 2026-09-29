// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Item } from '@zephyrex/auth/NavMenu';
import type { NavItemDefinition } from './types';

type NavSubItem = NonNullable<Item['items']>[number];

const toSubItem = (def: NavItemDefinition): NavSubItem => ({
  title: def.title,
  url: def.url,
  ...(def.icon !== undefined ? { icon: def.icon } : {}),
});

/**
 * Convert the nav entries that config and extensions contribute into sidebar menu items.
 * The sidebar renders two levels, so a definition's children become its sub-items.
 */
export const toNavMenuItems = (defs: readonly NavItemDefinition[]): Item[] =>
  defs.map((def) => ({
    title: def.title,
    url: def.url,
    ...(def.icon !== undefined ? { icon: def.icon } : {}),
    ...(def.children !== undefined && def.children.length > 0 ? { items: def.children.map(toSubItem) } : {}),
  }));
