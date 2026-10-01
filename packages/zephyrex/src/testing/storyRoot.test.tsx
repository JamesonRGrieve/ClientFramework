// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useSWRConfig } from 'swr';
import { describe, expect, it } from 'vitest';
import { STORY_CONFIG, ZephyrexStoryRoot } from './storyRoot';
import { useZephyrexConfig } from '@/lib/zephyrex/ZephyrexProvider';

function ConfigProbe(): ReactElement {
  const { config } = useZephyrexConfig();
  const { cache } = useSWRConfig();
  return <p>{`${config.app.name} ${config.server.baseUrl} ${[...cache.keys()].length}`}</p>;
}

describe('ZephyrexStoryRoot', () => {
  it('renders its story under the story config, with an empty request cache', () => {
    const { container } = render(
      <ZephyrexStoryRoot>
        <ConfigProbe />
      </ZephyrexStoryRoot>,
    );
    expect(container.textContent).toBe(`${STORY_CONFIG.app.name} ${STORY_CONFIG.server.baseUrl} 0`);
  });

  it('gives each story a cache of its own', () => {
    const seenCaches = new Set<ReturnType<typeof useSWRConfig>['cache']>();
    function CacheProbe(): ReactElement {
      seenCaches.add(useSWRConfig().cache);
      return <p />;
    }
    render(
      <ZephyrexStoryRoot>
        <CacheProbe />
      </ZephyrexStoryRoot>,
    );
    render(
      <ZephyrexStoryRoot>
        <CacheProbe />
      </ZephyrexStoryRoot>,
    );
    expect(seenCaches.size).toBe(2);
  });
});
