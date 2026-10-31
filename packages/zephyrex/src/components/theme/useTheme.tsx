'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCookiePreference } from './useCookiePreference';

const THEME_DEFAULTS = ['light', 'dark', 'colorblind', 'colorblind-dark'];

const normalizeTheme = (value: string): string => {
  if (value === 'default' || value === 'light' || !value) {
    return 'light';
  }
  return value;
};

const shouldAddThemeClass = (value: string): boolean => value !== 'light';

/** The device's own light or dark setting, for someone who has not chosen a theme here. */
const systemTheme = (): string | undefined =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : undefined;

export const useTheme = (customThemes?: string[], initialTheme?: string) => {
  const fallback = initialTheme ?? systemTheme();
  const { options, current, setCurrent } = useCookiePreference({
    cookieName: 'theme',
    defaults: [...THEME_DEFAULTS, ...(customThemes ?? [])],
    ...(fallback !== undefined ? { initialValue: fallback } : {}),
    target: 'html',
    normalize: normalizeTheme,
    shouldAddClass: shouldAddThemeClass,
  });

  return {
    themes: options,
    currentTheme: current,
    setTheme: setCurrent,
  };
};
