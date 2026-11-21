// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Item } from '@zephyrex/auth/NavMenu';
import type { NavChild, NavItemDefinition } from './types';

type NavSubItem = NonNullable<Item['items']>[number];

const toSubItem = (def: NavItemDefinition): NavSubItem => ({
  title: def.title,
  url: def.url,
  ...(def.icon !== undefined ? { icon: def.icon } : {}),
});

const EMPTY: readonly NavChild[] = [];

/**
 * Convert the nav entries that config and extensions contribute into sidebar menu items.
 * The sidebar renders two levels, so a definition's children become its sub-items, followed by
 * the ones its `useChildren` hook gave (`computed`, by the entry's title).
 */
export const toNavMenuItems = (
  defs: readonly NavItemDefinition[],
  computed: ReadonlyMap<string, readonly NavChild[]> = new Map(),
): Item[] =>
  defs.map((def) => {
    const items = [...(def.children ?? []).map(toSubItem), ...(computed.get(def.title) ?? EMPTY).map(toSubItem)];
    return {
      title: def.title,
      url: def.url,
      ...(def.icon !== undefined ? { icon: def.icon } : {}),
      ...(items.length > 0 ? { items } : {}),
    };
  });

/** Whether two lists of computed sub-entries are the same (so the sidebar only re-renders on a change). */
export function sameChildren(a: readonly NavChild[], b: readonly NavChild[]): boolean {
  return (
    a.length === b.length &&
    a.every((one, at) => {
      const other = b.at(at);
      return other?.title === one.title && other.url === one.url;
    })
  );
}
