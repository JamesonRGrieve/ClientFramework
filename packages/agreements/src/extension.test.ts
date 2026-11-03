// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { agreementsExtension as registered } from 'zephyrex/extensions';
import { AgreementsRoute, agreementsExtension } from './extension';
import { renderAgreements } from './testing.mocks';

describe('agreementsExtension', () => {
  it('is the registered agreements extension, with the page and a menu entry', () => {
    expect(agreementsExtension).toMatchObject({ name: 'agreements', serverExtension: 'agreements' });
    expect(agreementsExtension.displayName).toBe(registered.displayName);
    expect(agreementsExtension.pages).toEqual([{ path: '/agreements', component: AgreementsRoute }]);
    expect(agreementsExtension.navItems).toEqual([{ title: 'Agreements', url: '/agreements' }]);
  });

  it('mounts the agreements page', async () => {
    const view = renderAgreements(createElement(AgreementsRoute));
    expect(await view.findByRole('heading', { name: 'Agreements', level: 1 })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
