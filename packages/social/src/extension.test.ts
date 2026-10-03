// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { socialExtension as registered } from 'zephyrex/extensions';
import { socialExtension } from './extension';
import { PublicationPage } from './PublicationPage';
import { PublicationsPage } from './PublicationsPage';

describe('socialExtension', () => {
  it('is the registered social extension, with the posts pages and a menu entry', () => {
    expect(socialExtension).toMatchObject({ name: 'social', serverExtension: 'social' });
    expect(socialExtension.displayName).toBe(registered.displayName);
    expect(socialExtension.pages).toEqual([
      { path: '/social', component: PublicationsPage },
      { path: '/social/:publicationId', component: PublicationPage },
    ]);
    expect(socialExtension.navItems).toEqual([{ title: 'Social Posts', url: '/social' }]);
  });
});
