// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KinshipLookup } from './KinshipLookup';
import { renderGenealogy } from './testing.mocks';

type View = ReturnType<typeof renderGenealogy>;

/** The pickers are ready once the people load (the lookup shows its pickers). */
const peopleLoaded = async (view: View): Promise<void> => {
  await view.findByRole('combobox', { name: 'Relative' });
};

/** Opens a searchable person picker and chooses someone from its list. */
const pick = async (user: ReturnType<typeof userEvent.setup>, view: View, label: string, name: string): Promise<void> => {
  await user.click(view.getByRole('combobox', { name: label }));
  await user.click(await view.findByRole('option', { name }));
};

describe('KinshipLookup', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says how two people are related, and through whom', async () => {
    const user = userEvent.setup();
    const view = renderGenealogy(<KinshipLookup />);
    await peopleLoaded(view);
    await pick(user, view, 'Person', 'Byron King-Noel');
    await pick(user, view, 'Relative', 'George Gordon Byron');
    const answer = await view.findByRole('status');
    expect(answer).toHaveTextContent('George Gordon Byron is Byron King-Noel’s grandparent.');
    expect(answer).toHaveTextContent('Through George Gordon Byron.');
  });

  it('starts from the person whose page it is on', async () => {
    const user = userEvent.setup();
    const view = renderGenealogy(<KinshipLookup initialPersonId='byron-jr' />);
    await peopleLoaded(view);
    await pick(user, view, 'Relative', 'Anne Blunt');
    expect(await view.findByRole('status')).toHaveTextContent('Anne Blunt is Byron King-Noel’s sibling.');
  });

  it('says when two people share no recorded ancestor', async () => {
    const user = userEvent.setup();
    const view = renderGenealogy(<KinshipLookup initialPersonId='byron' />);
    await peopleLoaded(view);
    await pick(user, view, 'Relative', 'Anne Isabella Milbanke');
    expect(await view.findByRole('status')).toHaveTextContent('share no recorded ancestor');
  });
});
