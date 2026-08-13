'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCookiePreference } from './useCookiePreference';

const THEME_DEFAULTS = ['light', 'dark', 'colorblind', 'colorblind-dark'];

const normalizeTheme = (value: string): string => {
  if (value === 'default' || value === 'light' || !value) return 'light';
  return value;
};

const shouldAddThemeClass = (value: string): boolean => value !== 'light';

export const useTheme = (customThemes?: string[], initialTheme?: string) => {
  const { options, current, setCurrent } = useCookiePreference({
    cookieName: 'theme',
    defaults: [...THEME_DEFAULTS, ...(customThemes ?? [])],
    ...(initialTheme !== undefined ? { initialValue: initialTheme } : {}),
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
