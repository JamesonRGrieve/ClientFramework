// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyFixture, personOf, type Store } from './genealogy.mocks';
import type { Person } from './genealogyApi';
import { Relatives } from './Relatives';
import { renderGenealogy } from './testing.mocks';

const ada = (store: Store): Person => personOf(store, 'ada');
const WILLIAM = 'William King';

describe('Relatives', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists Ada's parents, husband and children, her marriage once", async () => {
    const store = familyFixture();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    const list = await view.findByRole('list', { name: 'Relatives' });
    const lines = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent.replace('Remove', ''));
    expect(lines.sort()).toEqual(
      [
        'Child (biological): Byron King-Noel',
        'Child (biological): Anne Blunt',
        'Child (biological): Ralph King-Milbanke',
        'Parent (biological): George Gordon Byron',
        'Parent (biological): Anne Isabella Milbanke',
        `Partner (marriage): ${WILLIAM}`,
      ].sort(),
    );
    expect(within(list).getByRole('link', { name: WILLIAM })).toHaveAttribute('href', '/genealogy/william');
  });

  it('removes a partnership in both directions', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    await user.click(await view.findByRole('button', { name: `Remove ${WILLIAM} as partner` }));
    await vi.waitFor(() => {
      expect(store.relationships.some((row) => row.kind === 'partnership')).toBe(false);
    });
    expect(await view.findByRole('list', { name: 'Relatives' })).not.toHaveTextContent(WILLIAM);
  });

  it('records a new relative, with the role the parent has', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    await view.findByRole('list', { name: 'Relatives' });
    await user.selectOptions(view.getByLabelText('Relative'), WILLIAM);
    await user.selectOptions(view.getByLabelText('Is Ada Lovelace’s'), 'Parent');
    await user.selectOptions(view.getByLabelText('Parent’s role'), 'step');
    await user.click(view.getByRole('button', { name: 'Add relative' }));
    expect(await view.findByText('Parent (step):')).toBeInTheDocument();
    expect(store.relationships.at(-1)).toMatchObject({
      person_id: 'william',
      target_person_id: 'ada',
      discriminator: 'step',
    });
  });

  it('asks who the relative is before recording one', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    await user.click(await view.findByRole('button', { name: 'Add relative' }));
    expect(view.getByRole('alert')).toHaveTextContent('Choose who the relative is.');
  });
});
