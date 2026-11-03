// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { squareCspAdditions, squareScript } from './square';

describe('Square hosts', () => {
  it('points sandbox and production at Square’s own hosts, from its published CSP', () => {
    expect(squareScript('sandbox')).toBe('https://sandbox.web.squarecdn.com/v1/square.js');
    expect(squareScript('production')).toBe('https://web.squarecdn.com/v1/square.js');
    expect(squareCspAdditions('production')['connect-src']).toContain('https://pci-connect.squareup.com');
    expect(squareCspAdditions('sandbox')['frame-src']).toEqual(['https://sandbox.web.squarecdn.com']);
  });

  it('lists every host a card form needs, under the directives Square names', () => {
    expect(Object.keys(squareCspAdditions('production')).sort()).toEqual(
      ['connect-src', 'font-src', 'frame-src', 'script-src', 'style-src'].sort(),
    );
  });
});
