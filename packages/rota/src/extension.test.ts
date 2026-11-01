// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { rotaExtension as registered } from 'zephyrex/extensions';
import { RotaRoute, rotaExtension } from './extension';
import { renderRota } from './testing.mocks';

describe('rotaExtension', () => {
  it('is the registered rota extension, with the rota page and a menu entry', () => {
    expect(rotaExtension).toMatchObject({ name: 'rota', serverExtension: 'rota' });
    expect(rotaExtension.displayName).toBe(registered.displayName);
    expect(rotaExtension.pages).toEqual([{ path: '/rota', component: RotaRoute }]);
    expect(rotaExtension.navItems).toEqual([{ title: 'Nights rota', url: '/rota' }]);
  });

  it('mounts the rota page, naming only you', async () => {
    const view = renderRota(createElement(RotaRoute));
    expect(await view.findByRole('heading', { name: 'Nights rota' })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
