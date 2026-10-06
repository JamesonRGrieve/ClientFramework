// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { abilitiesMatching, AgentAbilities, abilityName } from './AgentAbilities';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { renderAgents } from './testing.mocks';

describe('abilityName and abilitiesMatching', () => {
  const { abilities } = agentsFixture();

  it('names an ability by its friendly name, else its name', () => {
    expect(abilityName({ name: 'web_search', friendly_name: 'Search the web' })).toBe('Search the web');
    expect(abilityName({ name: 'web_search', friendly_name: '' })).toBe('web_search');
    expect(abilityName({ name: 'web_search', friendly_name: null })).toBe('web_search');
  });

  it('matches by name, friendly name or description, all of them for a blank filter', () => {
    expect(abilitiesMatching(abilities, ' ').map(({ id }) => id)).toEqual(['ab-search', 'ab-email']);
    expect(abilitiesMatching(abilities, 'PAGES').map(({ id }) => id)).toEqual(['ab-search']);
    expect(abilitiesMatching(abilities, 'send_').map(({ id }) => id)).toEqual(['ab-email']);
  });
});

describe('AgentAbilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows every ability, checked when the agent may use it', async () => {
    const view = renderAgents(<AgentAbilities agentId={AGENT_ID} />);
    expect(await view.findByLabelText(/Search the web/)).toBeChecked();
    expect(view.getByLabelText('Send email')).not.toBeChecked();
    expect(view.getByText('It may use 1 ability.')).toBeInTheDocument();
  });

  it('grants an ability, and disables a grant', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentAbilities agentId={AGENT_ID} />, store);
    await user.click(await view.findByLabelText('Send email'));
    expect(await view.findByText('It may use 2 abilities.')).toBeInTheDocument();
    await user.click(view.getByLabelText(/Search the web/));
    await vi.waitFor(() => {
      expect(rowOf(store.grants, 'grant-search').enabled).toBe(false);
    });
    expect(store.grants.at(-1)).toMatchObject({ ability_id: 'ab-email', enabled: true });
  });

  it('finds an ability, and says when none matches', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<AgentAbilities agentId={AGENT_ID} />);
    const filter = view.getByLabelText('Find an ability');
    await user.type(filter, 'email');
    const list = await view.findByRole('list', { name: 'Abilities' });
    await vi.waitFor(() => {
      expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    });
    await user.type(filter, 'xyz');
    expect(await view.findByText('No ability matches.')).toBeInTheDocument();
  });
});
