'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface ExampleBannerValue {
  readonly extensionId: string;
}

const ExampleBannerContext = createContext<ExampleBannerValue>({ extensionId: 'example-banner' });

export function ExampleBannerProvider({ children }: { children: ReactNode }): ReactNode {
  return <ExampleBannerContext.Provider value={{ extensionId: 'example-banner' }}>{children}</ExampleBannerContext.Provider>;
}

export function useExampleBanner(): ExampleBannerValue {
  return useContext(ExampleBannerContext);
}
