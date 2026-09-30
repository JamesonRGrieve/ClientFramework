'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import Link from 'next/link.js';
import { useEffect, useState } from 'react';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { SidebarInset } from '@/components/ui/sidebar';

export default function BadGateway() {
  const [link, _setLink] = useState('/');
  useEffect(() => {
    // setLink(getCookie('href')?.toString() ?? '/');
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
