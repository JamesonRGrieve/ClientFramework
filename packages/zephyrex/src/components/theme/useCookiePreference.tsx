'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getCookie, setCookie } from 'cookies-next/client';
import { useCallback, useEffect, useState } from 'react';
import { cookieDomainOptions } from '@/lib/zephyrex/cookies';

const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 365;
const COOKIE_MAX_AGE_MS = DAYS_PER_YEAR * MS_PER_DAY;

interface CookiePreferenceOptions {
  cookieName: string;
  defaults: string[];
  initialValue?: string;
  target?: 'body' | 'html';
  normalize?: (value: string) => string;
  shouldAddClass?: (value: string) => boolean;
}

interface CookiePreferenceResult {
  options: string[];
  current: string;
  setCurrent: (value: string) => void;
}

export function useCookiePreference({
  cookieName,
  defaults,
  initialValue,
  target = 'body',
  normalize = (v) => v,
  shouldAddClass = () => true,
}: CookiePreferenceOptions): CookiePreferenceResult {
  const [options] = useState(() => Array.from(new Set([...defaults])));

  const [current, setCurrentRaw] = useState(() => {
    const raw = getCookie(cookieName) ?? initialValue ?? defaults.at(0) ?? '';
    return normalize(raw);
  });

  const setCurrent = useCallback(
    (value: string) => {
      const normalized = normalize(value);
      setCurrentRaw(normalized);
    },
    [normalize],
  );

  useEffect(() => {
    const el = target === 'html' ? document.documentElement : document.body;
    el.classList.remove(...options);

    if (shouldAddClass(current)) {
      el.classList.add(current);
    }

    setCookie(cookieName, current, {
      expires: new Date(Date.now() + COOKIE_MAX_AGE_MS),
      ...cookieDomainOptions(),
    });
  }, [current, options, cookieName, target, shouldAddClass]);

  return { options, current, setCurrent };
}
