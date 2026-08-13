'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useDeprecations } from '@/hooks/api';

/**
 * Surfaces server-emitted Deprecation/Sunset response headers globally.
 * The ApiClient writes notices into a module-level store the moment it sees
 * the header on any response; this component subscribes and renders.
 */
export function DeprecationBanner(): JSX.Element | null {
  const { notices, dismiss } = useDeprecations();
  if (notices.length === 0) return null;

  return (
    <div className='fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2'>
      {notices.map((notice) => (
        <Alert key={notice.resource} variant='destructive' className='bg-background/95 backdrop-blur'>
          <AlertTitle className='flex items-center justify-between'>
            <span>API deprecation</span>
            <Button size='sm' variant='ghost' onClick={() => dismiss(notice.resource)}>
              Dismiss
            </Button>
          </AlertTitle>
          <AlertDescription className='space-y-1 text-xs'>
            <div>
              <span className='font-mono'>{notice.resource}</span>
            </div>
            {notice.deprecation ? (
              <div>
                Deprecated: <span className='font-mono'>{notice.deprecation}</span>
              </div>
            ) : null}
            {notice.sunset ? (
              <div>
                Sunset: <span className='font-mono'>{notice.sunset}</span>
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
