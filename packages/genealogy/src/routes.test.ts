// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { GENEALOGY_PATH, personPath } from './routes';

describe('genealogy routes', () => {
  it("mounts under /genealogy, with each person's page below it", () => {
    expect(GENEALOGY_PATH).toBe('/genealogy');
    expect(personPath('ada')).toBe('/genealogy/ada');
    expect(personPath('a/b c')).toBe('/genealogy/a%2Fb%20c');
  });
});
