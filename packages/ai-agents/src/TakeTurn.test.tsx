// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { TakeTurn } from './TakeTurn';
import { renderAgents } from './testing.mocks';

const RUN = 'Run a turn now';

describe('TakeTurn', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs a turn handed the instructions, and says how it ended', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<TakeTurn agentId={AGENT_ID} />, store);
    await user.type(view.getByLabelText('Instructions (optional)'), ' Summarise the week. ');
    await user.click(view.getByRole('button', { name: RUN }));
    expect(await view.findByRole('status')).toHaveTextContent(/^Done · /);
    expect(store.turns.at(-1)).toMatchObject({ agent_id: AGENT_ID, payload: 'Summarise the week.' });
  });

  it('runs a turn handed nothing without instructions', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<TakeTurn agentId={AGENT_ID} />, store);
    await user.click(view.getByRole('button', { name: RUN }));
    expect(await view.findByRole('status')).toBeInTheDocument();
    expect(store.turns.at(-1)?.payload).toBeNull();
  });

  it('says so when the agent is gone', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<TakeTurn agentId='gone' />);
    await user.click(view.getByRole('button', { name: RUN }));
    expect(await view.findByRole('alert')).toBeInTheDocument();
  });
});
