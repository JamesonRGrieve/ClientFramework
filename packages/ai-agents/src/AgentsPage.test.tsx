// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { agentsFixture } from './agents.mocks';
import { AgentsPage } from './AgentsPage';
import { renderAgents } from './testing.mocks';

const MAKE = 'Make agent';

describe('AgentsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the agents favourites first, each linking to its page', async () => {
    const view = renderAgents(<AgentsPage />);
    const list = await view.findByRole('list', { name: 'Agents' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['★ Favourite: Scribe', 'Helper']);
    expect(within(list).getByRole('link', { name: 'Helper' })).toHaveAttribute('href', '/agents/helper');
  });

  it('makes an agent with the models chosen and opens it', async () => {
    const store = agentsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderAgents(<AgentsPage />, store);
    await user.type(view.getByLabelText('Name'), ' Clerk ');
    await user.selectOptions(view.getByLabelText('Thinks with'), await view.findByRole('option', { name: 'Fast models' }));
    await user.click(view.getByRole('button', { name: MAKE }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/agents/agent-1');
    });
    expect(store.agents.at(-1)).toMatchObject({ name: 'Clerk', rotation_id: 'fast' });
  });

  it('asks for a name before making an agent', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<AgentsPage />);
    await user.click(view.getByRole('button', { name: MAKE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Give the agent a name.');
  });

  it('says so when there are no agents', async () => {
    const view = renderAgents(<AgentsPage />, { ...agentsFixture(), agents: [] });
    expect(await view.findByText('You have no agents yet.')).toBeInTheDocument();
  });
});
