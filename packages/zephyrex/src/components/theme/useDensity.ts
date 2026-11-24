'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getCookie, setCookie } from 'cookies-next/client';
import { useEffect, useState } from 'react';
import { DENSITY_COOKIE, type Density, densityFrom } from './density';
import { cookieDomainOptions } from '@/lib/zephyrex/cookies';

const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 365;
const COOKIE_MAX_AGE_MS = DAYS_PER_YEAR * MS_PER_DAY;

/**
 * The person's density on this device: kept in the `density` cookie and shown as `data-density` on
 * `<html>`, which the framework's CSS variables follow. ZephyrexApp calls it, so an app whose layout
 * doesn't set the attribute still gets it after the first render.
 */
export function useDensity(initial?: string): { density: Density; setDensity: (density: Density) => void } {
  const [density, setDensity] = useState<Density>(() => densityFrom(initial ?? getCookie(DENSITY_COOKIE)));

  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') {
      root.dataset.density = 'compact';
    } else {
      delete root.dataset.density;
    }
    setCookie(DENSITY_COOKIE, density, {
      expires: new Date(Date.now() + COOKIE_MAX_AGE_MS),
      ...cookieDomainOptions(),
    });
  }, [density]);

  return { density, setDensity };
}
