// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { genealogyExtension } from './index';

describe('genealogyExtension', () => {
  it("pairs with the server's genealogy extension, its pages left to @zephyrex/genealogy", () => {
    expect(genealogyExtension).toMatchObject({ name: 'genealogy', serverExtension: 'genealogy', displayName: 'Genealogy' });
    expect(genealogyExtension.pages).toBeUndefined();
  });
});
