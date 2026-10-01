// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyFixture } from './genealogy.mocks';
import { PersonPage } from './PersonPage';
import { renderGenealogy } from './testing.mocks';

describe('PersonPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a person's details, relatives and family tree", async () => {
    const view = renderGenealogy(<PersonPage params={{ personId: 'ada' }} />);
    expect(await view.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(view.getByText('1815–1852')).toBeInTheDocument();
    expect(await view.findByRole('list', { name: 'Relatives' })).toHaveTextContent('William King');
    expect(await view.findByRole('region', { name: 'Parents' })).toHaveTextContent('George Gordon Byron');
  });

  it('saves changes to the details', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<PersonPage params={{ personId: 'ada' }} />, store);
    const renamed = 'Augusta Ada King';
    const name = await view.findByLabelText('Name');
    await user.clear(name);
    await user.type(name, renamed);
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('heading', { level: 1, name: renamed })).toBeInTheDocument();
    expect(store.persons.find((row) => row.id === 'ada')?.name).toBe(renamed);
  });

  it('removes the person and goes back to the tree', async () => {
    const store = familyFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderGenealogy(<PersonPage params={{ personId: 'ralph' }} />, store);
    await user.click(await view.findByRole('button', { name: 'Remove Ralph King-Milbanke from the tree' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/genealogy');
    });
    expect(store.persons.some((row) => row.id === 'ralph')).toBe(false);
  });

  it("says when the person isn't in the tree", async () => {
    const view = renderGenealogy(<PersonPage params={{ personId: 'nobody' }} />);
    expect(await view.findByText('This person is not in your family tree.')).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to the family tree' })).toHaveAttribute('href', '/genealogy');
  });
});
