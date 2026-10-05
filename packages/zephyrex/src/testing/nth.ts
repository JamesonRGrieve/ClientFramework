// SPDX-License-Identifier: AGPL-3.0-or-later

/** The `index`th of `items` (negative from the end); a test that finds fewer is wrong. */
export function nth<T>(items: readonly T[], index: number): T {
  const found = items.at(index);
  if (found === undefined) {
    throw new Error(`Expected an item at ${String(index)} of ${String(items.length)}`);
  }
  return found;
}
