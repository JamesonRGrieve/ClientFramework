// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { renderAgents } from './testing.mocks';
import { Turns } from './Turns';

const WHAT_IT_DID = 'What it did';

describe('Turns', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the turns newest first, with how each ended and what it was asked', async () => {
    const view = renderAgents(<Turns agentId={AGENT_ID} />);
    const items = within(await view.findByRole('list', { name: 'Turns' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Failed: No model answeredWhat it did',
      expect.stringMatching(/^Done · .+What it didWrite the weekly summary\.$/),
    ]);
  });

  it('opens a turn onto what it did, nested, and closes it again', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<Turns agentId={AGENT_ID} />);
    await view.findByRole('list', { name: 'Turns' });
    await user.click(nth(view.getAllByRole('button', { name: WHAT_IT_DID }), 1));
    expect(await view.findByRole('list', { name: WHAT_IT_DID })).toHaveTextContent(
      'Searched the web · Doneengine newsRead a page · Warning',
    );
    await user.click(view.getByRole('button', { name: 'Hide' }));
    expect(view.queryByRole('list', { name: WHAT_IT_DID })).not.toBeInTheDocument();
  });

  it('says when a turn recorded nothing', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<Turns agentId={AGENT_ID} />);
    await view.findByRole('list', { name: 'Turns' });
    await user.click(nth(view.getAllByRole('button', { name: WHAT_IT_DID }), 0));
    expect(await view.findByText('It did nothing it recorded.')).toBeInTheDocument();
  });

  it('says when the agent has not taken a turn', async () => {
    const view = renderAgents(<Turns agentId={AGENT_ID} />, { ...agentsFixture(), turns: [] });
    expect(await view.findByText('It has not taken a turn yet.')).toBeInTheDocument();
  });
});
