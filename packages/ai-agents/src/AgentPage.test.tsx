// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentPage } from './AgentPage';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { renderAgents } from './testing.mocks';

describe('AgentPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the agent with each of its sections', async () => {
    const view = renderAgents(<AgentPage params={{ agentId: AGENT_ID }} />);
    expect(await view.findByRole('heading', { name: 'Scribe', level: 1 })).toBeInTheDocument();
    const sections = [
      'Run it',
      'Turns',
      'Triggers',
      'Abilities',
      'Context',
      'Working memory',
      'Long-term memory',
      'Conversations',
      'Details',
    ];
    for (const title of sections) {
      expect(view.getByRole('heading', { name: title, level: 3 })).toBeInTheDocument();
    }
    expect(view.getByRole('link', { name: 'Agents' })).toHaveAttribute('href', '/agents');
  });

  it('links a context prompt to the agent', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentPage params={{ agentId: AGENT_ID }} />, store);
    await user.selectOptions(await view.findByLabelText('Add a prompt'), await view.findByRole('option', { name: 'Brief' }));
    await user.click(view.getByRole('button', { name: 'Link' }));
    await vi.waitFor(() => {
      expect(store.agentPrompts.map(({ prompt_id: id }) => id)).toEqual(['style', 'brief']);
    });
  });

  it('says when the agent does not exist or is not the user’s', async () => {
    const view = renderAgents(<AgentPage params={{ agentId: 'gone' }} />);
    expect(await view.findByText(/This agent does not exist or is not yours to see\./)).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to your agents' })).toHaveAttribute('href', '/agents');
  });
});
