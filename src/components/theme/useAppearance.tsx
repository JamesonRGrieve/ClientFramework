'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCookiePreference } from './useCookiePreference';

const APPEARANCE_DEFAULTS = ['icons', 'labels'];

export const useAppearance = (customAppearances?: string[], initialAppearance?: string) => {
  const { options, current, setCurrent } = useCookiePreference({
    cookieName: 'appearance',
    defaults: [...APPEARANCE_DEFAULTS, ...(customAppearances ?? [])],
    initialValue: initialAppearance ?? 'labels',
    target: 'body',
  });

  return {
    appearances: options,
    appearance: current,
    setAppearance: setCurrent,
  };
};
