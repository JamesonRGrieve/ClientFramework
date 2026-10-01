// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { familyFixture } from './genealogy.mocks';
import { PersonSchema } from './genealogyApi';
import { renderGenealogy } from './testing.mocks';

describe('renderGenealogy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the test app, with fetch answered by the genealogy routes', async () => {
    const view = renderGenealogy(createElement('p', null, 'hello'));
    expect(view.getByText('hello')).toBeInTheDocument();
    const answer = await fetch('http://localhost:1996/v1/person');
    const { persons } = z.object({ persons: z.array(PersonSchema) }).parse(await answer.json());
    expect(persons).toHaveLength(familyFixture().persons.length);
  });
});
