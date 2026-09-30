// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Decorator } from '@storybook/nextjs';
import type { ReactElement, ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { ZephyrexProvider } from '../src/lib/zephyrex/ZephyrexProvider';
import type { ZephyrexConfig } from '../src/lib/zephyrex/types';

export const STORY_CONFIG: ZephyrexConfig = { server: { baseUrl: 'http://localhost:1996' }, app: { name: 'Storybook' } };

/**
 * Zephyrex under the story config, with an empty request cache of its own, so each story's msw
 * handlers answer its requests rather than another story's cached ones.
 */
export function ZephyrexStoryRoot({ children }: { children: ReactNode }): ReactElement {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <ZephyrexProvider config={STORY_CONFIG}>{children}</ZephyrexProvider>
    </SWRConfig>
  );
}

export const withZephyrexApi: Decorator = (Story) => (
  <ZephyrexStoryRoot>
    <Story />
  </ZephyrexStoryRoot>
);
