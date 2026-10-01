'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (onChange: () => void): (() => void) => {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

const isMobileViewport = (): boolean => window.innerWidth < MOBILE_BREAKPOINT;

/** The server has no viewport, so it renders the desktop layout. */
const isMobileOnServer = (): boolean => false;

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, isMobileViewport, isMobileOnServer);
}
