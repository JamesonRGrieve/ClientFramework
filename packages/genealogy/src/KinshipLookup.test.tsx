// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KinshipLookup } from './KinshipLookup';
import { renderGenealogy } from './testing.mocks';

/** The pickers fill once the people load. */
const peopleLoaded = async (view: ReturnType<typeof renderGenealogy>): Promise<void> => {
  await view.findAllByRole('option', { name: 'Ada Lovelace' });
};

describe('KinshipLookup', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says how two people are related, and through whom', async () => {
    const user = userEvent.setup();
    const view = renderGenealogy(<KinshipLookup />);
    await peopleLoaded(view);
    await user.selectOptions(view.getByLabelText('Person'), 'Byron King-Noel');
    await user.selectOptions(view.getByLabelText('Relative'), 'George Gordon Byron');
    const answer = await view.findByRole('status');
    expect(answer).toHaveTextContent('George Gordon Byron is Byron King-Noel’s grandparent.');
    expect(answer).toHaveTextContent('Through George Gordon Byron.');
  });

  it('starts from the person whose page it is on', async () => {
    const user = userEvent.setup();
    const view = renderGenealogy(<KinshipLookup initialPersonId='byron-jr' />);
    await peopleLoaded(view);
    await user.selectOptions(view.getByLabelText('Relative'), 'Anne Blunt');
    expect(await view.findByRole('status')).toHaveTextContent('Anne Blunt is Byron King-Noel’s sibling.');
  });

  it('says when two people share no recorded ancestor', async () => {
    const user = userEvent.setup();
    const view = renderGenealogy(<KinshipLookup initialPersonId='byron' />);
    await peopleLoaded(view);
    await user.selectOptions(view.getByLabelText('Relative'), 'Anne Isabella Milbanke');
    expect(await view.findByRole('status')).toHaveTextContent('share no recorded ancestor');
  });
});
