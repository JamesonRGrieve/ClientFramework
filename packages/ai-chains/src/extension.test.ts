// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { aiChainsExtension as registered } from 'zephyrex/extensions';
import { ChainPage } from './ChainPage';
import { ChainsPage } from './ChainsPage';
import { aiChainsExtension } from './extension';

describe('aiChainsExtension', () => {
  it('is the registered AI chains extension, with the chain pages and a menu entry', () => {
    expect(aiChainsExtension).toMatchObject({ name: 'ai_chains', serverExtension: 'ai_chains' });
    expect(aiChainsExtension.displayName).toBe(registered.displayName);
    expect(aiChainsExtension.pages).toEqual([
      { path: '/chains', component: ChainsPage },
      { path: '/chains/:chainId', component: ChainPage },
    ]);
    expect(aiChainsExtension.navItems).toEqual([{ title: 'Chains', url: '/chains' }]);
  });
});
