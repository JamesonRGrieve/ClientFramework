// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { publicationPath, SOCIAL_PATH } from './routes';

describe('social routes', () => {
  it('puts each post under the social page, its id escaped', () => {
    expect(SOCIAL_PATH).toBe('/social');
    expect(publicationPath('p 1/2')).toBe('/social/p%201%2F2');
  });
});
