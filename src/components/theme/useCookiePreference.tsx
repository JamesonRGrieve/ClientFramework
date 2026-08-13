'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect, useCallback } from 'react';
import { setCookie, getCookie } from 'cookies-next';

const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

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
    const cookieValue = getCookie(cookieName);
    const raw = cookieValue?.toString() ?? initialValue ?? defaults[0] ?? '';
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

    const cookieDomain = process.env['NEXT_PUBLIC_COOKIE_DOMAIN'];
    setCookie(cookieName, current, {
      expires: new Date(Date.now() + COOKIE_MAX_AGE_MS),
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });
  }, [current, options, cookieName, target, shouldAddClass]);

  return { options, current, setCurrent };
}
