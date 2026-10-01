// SPDX-License-Identifier: AGPL-3.0-or-later
import { cookies } from 'next/headers.js';
import Link from 'next/link.js';
import { ThemeToggle } from 'zephyrex/components/theme/ThemeToggle';
import { Button } from 'zephyrex/ui/button';
import { accountsEnabled, DEFAULT_AUTH_PATH } from 'zephyrex';
import config from '@/zephyrex.config';

export default async function Home() {
  return (
    <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className='w-full'>
      <header
        className='sticky top-0 flex items-center justify-between gap-4 px-4 border-b md:px-6 bg-muted min-h-16'
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >
        <div className='flex items-center'>
          <Link href='/' className='flex items-center gap-2 text-lg font-semibold md:text-lg text-foreground'>
            <span className=''>{config.app.name}</span>
          </Link>
        </div>
        <div className='flex items-center gap-2'>
          <ThemeToggle initialTheme={(await cookies()).get('theme')?.value ?? 'light'} />
          {accountsEnabled(config) && (
            <Link href={config.auth?.authPath ?? DEFAULT_AUTH_PATH}>
              <Button size='lg' className='px-4 rounded-full'>
                Login or Register
              </Button>
            </Link>
          )}
        </div>
      </header>
      <main />
    </div>
  );
}
