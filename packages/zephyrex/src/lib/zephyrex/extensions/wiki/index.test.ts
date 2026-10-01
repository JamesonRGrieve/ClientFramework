// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { wikiExtension } from './index';

describe('wikiExtension', () => {
  it("pairs with the server's wiki extension, with no client pages of its own", () => {
    expect(wikiExtension).toMatchObject({ name: 'wiki', serverExtension: 'wiki', displayName: 'Wiki' });
    expect(wikiExtension.pages).toBeUndefined();
  });
});
