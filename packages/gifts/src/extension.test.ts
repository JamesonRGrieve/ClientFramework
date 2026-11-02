// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { giftsExtension as registered } from 'zephyrex/extensions';
import { GiftsRoute, giftsExtension } from './extension';
import { renderGifts } from './testing.mocks';

describe('giftsExtension', () => {
  it('is the registered gifts extension, with the gift list and a menu entry', () => {
    expect(giftsExtension).toMatchObject({ name: 'gifts', serverExtension: 'gifts' });
    expect(giftsExtension.displayName).toBe(registered.displayName);
    expect(giftsExtension.pages).toEqual([{ path: '/gifts', component: GiftsRoute }]);
    expect(giftsExtension.navItems).toEqual([{ title: 'Gifts', url: '/gifts' }]);
  });

  it('mounts the gift list', async () => {
    const view = renderGifts(createElement(GiftsRoute));
    expect(await view.findByRole('heading', { name: 'Gifts', level: 1 })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
