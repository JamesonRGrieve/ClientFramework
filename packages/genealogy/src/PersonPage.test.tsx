// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyFixture } from './genealogy.mocks';
import { FAMILY_TREE } from './options';
import { GenealogyOptionsProvider } from './OptionsProvider';
import { PersonPage } from './PersonPage';
import { renderGenealogy } from './testing.mocks';

const TREE_PATH = '/genealogy';

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
      expect(push).toHaveBeenCalledWith(TREE_PATH);
    });
    expect(store.persons.some((row) => row.id === 'ralph')).toBe(false);
  });

  it("says when the person isn't in the tree", async () => {
    const view = renderGenealogy(<PersonPage params={{ personId: 'nobody' }} />);
    expect(await view.findByText('This person is not in your tree.')).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Family tree' })).toHaveAttribute('href', TREE_PATH);
  });

  it('leaves out family history in an app without lineage, starting a new tie from partners', async () => {
    const view = renderGenealogy(
      <GenealogyOptionsProvider options={{ ...FAMILY_TREE, tree: 'People', lineage: false, gedcom: false }}>
        <PersonPage params={{ personId: 'ada' }} />
      </GenealogyOptionsProvider>,
    );
    expect(await view.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'People' })).toHaveAttribute('href', TREE_PATH);
    expect(view.getByLabelText('Birthday')).toBeInTheDocument();
    expect(view.queryByLabelText('Died')).not.toBeInTheDocument();
    expect(view.queryByText('How are they related?')).not.toBeInTheDocument();
    expect(view.queryByText('Family tree')).not.toBeInTheDocument();
    expect(view.getByLabelText('Is Ada Lovelace’s')).toHaveValue('partner');
    expect(view.getByRole('heading', { name: 'Connections' })).toBeInTheDocument();
    expect(view.getByRole('button', { name: 'Add connection' })).toBeInTheDocument();
  });

  it("shows the app's panels after the details, given the person", async () => {
    const Panel = ({ person }: { person: { name: string | null } }): ReactElement => <p>Card for {person.name}</p>;
    const view = renderGenealogy(
      <GenealogyOptionsProvider options={{ ...FAMILY_TREE, panels: [{ name: 'card', component: Panel }] }}>
        <PersonPage params={{ personId: 'ada' }} />
      </GenealogyOptionsProvider>,
    );
    expect(await view.findByText('Card for Ada Lovelace')).toBeInTheDocument();
  });
});
