// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { genealogyExtension as registered } from 'zephyrex/extensions/genealogy';
import { createGenealogyExtension, genealogyExtension } from './extension';
import { GenealogyPage } from './GenealogyPage';
import { PersonPage } from './PersonPage';

const PATH = '/genealogy';

describe('genealogyExtension', () => {
  it('is the registered genealogy extension, with its pages and menu entry', () => {
    expect(genealogyExtension).toMatchObject({ name: 'genealogy', serverExtension: 'genealogy' });
    expect(genealogyExtension.displayName).toBe(registered.displayName);
    expect(genealogyExtension.pages).toEqual([
      { path: PATH, component: GenealogyPage },
      { path: '/genealogy/:personId', component: PersonPage },
    ]);
    expect(genealogyExtension.navItems).toEqual([{ title: 'Family tree', url: PATH }]);
  });

  it('names its menu entry after the tree an app asks for', () => {
    expect(createGenealogyExtension({ tree: 'People' }).navItems).toEqual([{ title: 'People', url: PATH }]);
    expect(createGenealogyExtension().providers).toHaveLength(1);
  });
});
