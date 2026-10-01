'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { ZephyrexProvider } from '../lib/zephyrex/ZephyrexProvider';
import type { ZephyrexConfig } from '../lib/zephyrex/types';
import { withSession } from './session';

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

/** A Storybook decorator rendering the story under {@link ZephyrexStoryRoot}. */
export const withZephyrexApi = (Story: ComponentType): ReactElement => (
  <ZephyrexStoryRoot>
    <Story />
  </ZephyrexStoryRoot>
);

/**
 * A Storybook decorator for a signed-in story: the browser gets the session's CSRF cookie, without
 * which the session-only reads (the user, their teams) ask nothing. Put it outside withZephyrexApi.
 */
export const withSignedIn = (Story: ComponentType): ReactElement => {
  withSession();
  return <Story />;
};
