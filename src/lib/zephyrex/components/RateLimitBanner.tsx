// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

interface RateLimitBannerProps {
  remainingMs: number;
}

export function RateLimitBanner({ remainingMs }: RateLimitBannerProps) {
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div
      role='alert'
      className='fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-100 border-b border-yellow-200'
    >
      <svg
        className='w-4 h-4 shrink-0'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth='2'
        stroke='currentColor'
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
        />
      </svg>
      <span>Too many requests. Retrying in {seconds}s...</span>
    </div>
  );
}
