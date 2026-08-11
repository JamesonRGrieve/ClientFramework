'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SidebarPage } from '@jgrieve/appwrapper/SidebarPage';
import { SidebarInset } from '@/components/ui/sidebar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
