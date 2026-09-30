// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers.js';
import type { ReactNode } from 'react';
import { SidebarContext } from '@/components/appwrapper/src/SidebarContext';
import { SidebarMain } from '@/components/appwrapper/src/SidebarMain';
import { ZephyrexApp } from '@/lib/zephyrex';
import { cn } from '@/lib/utils';
import config from '@/zephyrex.config';
import './globals.css';

const appUri = process.env.NEXT_PUBLIC_APP_URI ?? '';
const logoUri = process.env.NEXT_PUBLIC_APP_LOGO_URI ?? '';
const adsenseAccount = process.env.NEXT_PUBLIC_ADSENSE_ACCOUNT ?? '';

export const metadata: Metadata = {
  title: config.app.name,
  ...(config.app.description === undefined ? {} : { description: config.app.description }),
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    title: config.app.name,
    ...(config.app.description === undefined ? {} : { description: config.app.description }),
    ...(appUri === '' ? {} : { url: appUri }),
    images: [logoUri === '' ? `${appUri}/favicon.ico` : logoUri],
  },
  ...(adsenseAccount === '' ? {} : { other: { 'google-adsense-account': adsenseAccount } }),
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  const requestCookies = await cookies();
  const theme = requestCookies.get('theme')?.value ?? config.app.defaultTheme ?? 'dark';
  const appearance = requestCookies.get('appearance')?.value ?? '';
  const htmlThemeClass = theme === 'dark' || theme === 'colorblind' || theme === 'colorblind-dark' ? theme : '';

  if (config.auth?.landingOnly === true) {
    return (
      <html lang='en' className={htmlThemeClass} suppressHydrationWarning>
        <body className={cn(theme, appearance)}>{children}</body>
      </html>
    );
  }
  return (
    <html lang='en' className={htmlThemeClass} suppressHydrationWarning>
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
