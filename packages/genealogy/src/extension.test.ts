// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { genealogyExtension as registered } from 'zephyrex/extensions/genealogy';
import { genealogyExtension } from './extension';
import { GenealogyPage } from './GenealogyPage';
import { PersonPage } from './PersonPage';

describe('genealogyExtension', () => {
  it('is the registered genealogy extension, with its pages and menu entry', () => {
    expect(genealogyExtension).toMatchObject({ name: 'genealogy', serverExtension: 'genealogy' });
    expect(genealogyExtension.displayName).toBe(registered.displayName);
    expect(genealogyExtension.pages).toEqual([
      { path: '/genealogy', component: GenealogyPage },
      { path: '/genealogy/:personId', component: PersonPage },
    ]);
    expect(genealogyExtension.navItems).toEqual([{ title: 'Family Tree', url: '/genealogy' }]);
  });
});
