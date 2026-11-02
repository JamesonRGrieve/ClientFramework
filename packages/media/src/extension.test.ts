// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mediaExtension as registered } from 'zephyrex/extensions';
import { mediaExtension, WatchListRoute } from './extension';
import { renderMedia } from './testing.mocks';

describe('mediaExtension', () => {
  it('is the registered media extension, with the watch-list and a menu entry', () => {
    expect(mediaExtension).toMatchObject({ name: 'media', serverExtension: 'media' });
    expect(mediaExtension.displayName).toBe(registered.displayName);
    expect(mediaExtension.pages).toEqual([{ path: '/watch-list', component: WatchListRoute }]);
    expect(mediaExtension.navItems).toEqual([{ title: 'Watch-list', url: '/watch-list' }]);
  });

  it('mounts the watch-list', async () => {
    const view = renderMedia(createElement(WatchListRoute));
    expect(await view.findByRole('heading', { name: 'Watch-list', level: 1 })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
