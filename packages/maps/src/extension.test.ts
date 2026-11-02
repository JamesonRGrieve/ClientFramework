// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mapsExtension as registered } from 'zephyrex/extensions';
import { MeetRoute, mapsExtension } from './extension';
import { renderMaps } from './testing.mocks';

describe('mapsExtension', () => {
  it('is the registered maps extension, with meeting in the middle and a menu entry', () => {
    expect(mapsExtension).toMatchObject({ name: 'maps', serverExtension: 'maps' });
    expect(mapsExtension.displayName).toBe(registered.displayName);
    expect(mapsExtension.pages).toEqual([{ path: '/meet', component: MeetRoute }]);
    expect(mapsExtension.navItems).toEqual([{ title: 'Meet in the middle', url: '/meet' }]);
  });

  it('mounts the page, from typed places only', async () => {
    const view = renderMaps(createElement(MeetRoute));
    expect(await view.findByRole('heading', { name: 'Meet in the middle' })).toBeInTheDocument();
    expect(view.queryByLabelText('Add someone’s place')).toBeNull();
    vi.unstubAllGlobals();
  });
});
