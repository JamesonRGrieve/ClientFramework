// SPDX-License-Identifier: AGPL-3.0-or-later
import Head from '@jgrieve/appwrapper/Head';
import { SidebarContext } from '@jgrieve/appwrapper/SidebarContext';
import { SidebarMain } from '@jgrieve/appwrapper/SidebarMain';
import { ZephyrexApp } from '@/lib/zephyrex';
import { cn } from '@/lib/utils';
import '@zephyrex/zod2gql';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import config from '@/zephyrex.config';
import './globals.css';

export default async function RootLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value ?? config.app.defaultTheme ?? 'dark';
  const appearance = cookieStore.get('appearance')?.value ?? '';
  const htmlThemeClass = theme === 'dark' || theme === 'colorblind' || theme === 'colorblind-dark' ? theme : '';

  if (process.env.LANDING_ONLY) {
    return (
      <html lang='en' className={htmlThemeClass} suppressHydrationWarning>
        <Head />
        <body className={cn(theme, appearance)}>{children}</body>
      </html>
    );
  }
  return (
    <html lang='en' className={htmlThemeClass} suppressHydrationWarning>
      <Head />
      <body className={cn(theme, appearance)}>
        <ZephyrexApp config={config}>
          <SidebarMain side='left' />
          {children}
          <SidebarContext side='right' />
        </ZephyrexApp>
      </body>
    </html>
  );
}
