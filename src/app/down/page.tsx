'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { safeRedirectPath } from '@zephyrex/auth/lib/redirect';
import { getCookie } from 'cookies-next';
import Link from 'next/link.js';
import { SidebarPage } from 'zephyrex/components/appwrapper/src/SidebarPage';
import { useBrowserValue } from 'zephyrex/hooks/useBrowserValue';
import { SidebarInset } from 'zephyrex/ui/sidebar';

const HOME = '/';

const interruptedPage = (): string => {
  const interrupted = getCookie('href');
  return safeRedirectPath(typeof interrupted === 'string' ? interrupted : '');
};

/** The auth middleware sends here when the API is down, remembering the page in the `href` cookie. */
export default function BadGateway() {
  const link = useBrowserValue(interruptedPage, HOME);
  return (
    <SidebarInset>
      <SidebarPage title=''>
        <h2>Server unavailable!</h2>
        <p>It appears your internet connection may have been disrupted, or our server is under maintenance.</p>
        <Link href={link}>Try Again</Link>
      </SidebarPage>
    </SidebarInset>
  );
}
