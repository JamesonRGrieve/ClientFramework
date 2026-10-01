// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { mediaExtension } from './index';

describe('mediaExtension', () => {
  it("pairs with the server's media extension, with no client pages of its own", () => {
    expect(mediaExtension).toMatchObject({ name: 'media', serverExtension: 'media', displayName: 'Media' });
    expect(mediaExtension.pages).toBeUndefined();
  });
});
