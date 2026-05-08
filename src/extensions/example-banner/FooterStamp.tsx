'use client';

import { useExampleBanner } from './provider';

const STAMP_VERSION = '0.0.1';

export function FooterStamp(): JSX.Element {
  const { extensionId } = useExampleBanner();
  return <div className='px-2 py-1 text-xs text-muted-foreground'>{`${extensionId} v${STAMP_VERSION}`}</div>;
}
