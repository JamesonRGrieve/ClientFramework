'use client';

import { useState } from 'react';
import { setCookie } from 'cookies-next';

const defaultThemes = ['default', 'dark', 'colorblind', 'colorblind-dark'];

export const useTheme = (customThemes?: string[], initialTheme?: string) => {
  const [themes, setThemes] = useState(() => {
    return Array.from(new Set([...defaultThemes, ...(customThemes ?? [])]));
  });

  const [currentTheme, setCurrentTheme] = useState(() => {
    const t = initialTheme ?? 'default';
    return t === 'default' || t === 'light' || !t ? 'light' : t;
  });

  const setTheme = (newTheme: string) => {
    // apply theme class to <html> for maximum compatibility
    const classList = document.documentElement.classList;

    // normalize: "default"/"light" => no class
    const isLight = newTheme === 'default' || newTheme === 'light' || !newTheme;
    const normalized = isLight ? 'light' : newTheme;

    // remove any previously applied theme classes
    classList.remove('default', 'light', 'dark', 'colorblind', 'colorblind-dark');

    // only add a class for non-light themes
    if (!isLight) {
      classList.add(normalized);
    }

    // persist normalized theme for SSR
    setCookie('theme', normalized, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    });

    setCurrentTheme(normalized);
  };

  return {
    themes,
    currentTheme,
    setThemes,
    setTheme,
  };
};
