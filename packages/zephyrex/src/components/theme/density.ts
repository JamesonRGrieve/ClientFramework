// SPDX-License-Identifier: AGPL-3.0-or-later
// Plain (not 'use client'), so a server layout can read the density cookie and set <html>'s attribute.

/** The cookie the chosen density is kept in, read by the server too (see `densityAttribute`). */
export const DENSITY_COOKIE = 'density';

/** The densities: comfortable is the framework's usual sizes, compact tightens them. */
export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];

const DEFAULT_DENSITY: Density = 'comfortable';

/** A density from a stored value: anything but `compact` is comfortable. */
export function densityFrom(value: string | undefined | null): Density {
  return value === 'compact' ? 'compact' : DEFAULT_DENSITY;
}

/**
 * The attribute for the app's `<html>`, from the server's read of the density cookie, so the first
 * paint is already the person's density: `<html {...densityAttribute(cookies.get('density')?.value)}>`.
 * Comfortable needs no attribute.
 */
export function densityAttribute(value: string | undefined): { 'data-density'?: 'compact' } {
  return densityFrom(value) === 'compact' ? { 'data-density': 'compact' } : {};
}
