'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { safeRedirectPath } from '@zephyrex/auth/lib/redirect';
import { getCookie } from 'cookies-next';
import Link from 'next/link.js';
import { useEffect, useState } from 'react';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { SidebarInset } from '@/components/ui/sidebar';

/** The auth middleware sends here when the API is down, remembering the page in the `href` cookie. */
export default function BadGateway() {
  const [link, setLink] = useState('/');
  useEffect(() => {
    const interrupted = getCookie('href');
    setLink(safeRedirectPath(typeof interrupted === 'string' ? interrupted : ''));
  }, []);
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
