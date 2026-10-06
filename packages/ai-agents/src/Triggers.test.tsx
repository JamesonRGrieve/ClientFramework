// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { renderAgents } from './testing.mocks';
import { Triggers } from './Triggers';

const MAKE = 'Make trigger';
const FIRES = 'Fires';

describe('Triggers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists what fires each trigger, its instructions and how often it fired', async () => {
    const view = renderAgents(<Triggers agentId={AGENT_ID} />);
    const items = within(await view.findByRole('list', { name: 'Triggers' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'On the schedule 0 9 * * 1OnWrite the weekly summary.priority 3 · fired 2 timesDelete',
      'On a signed call to its webhookOnpriority 1 · fired 0 timesNew signing secretDelete',
    ]);
  });

  it('switches a trigger off, and deletes one', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<Triggers agentId={AGENT_ID} />, store);
    const items = within(await view.findByRole('list', { name: 'Triggers' })).getAllByRole('listitem');
    await user.click(within(nth(items, 0)).getByLabelText('On'));
    await vi.waitFor(() => {
      expect(rowOf(store.triggers, 'every-monday').enabled).toBe(false);
    });
    await user.click(within(nth(items, 1)).getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(store.triggers.map(({ id }) => id)).toEqual(['every-monday']);
    });
  });

  it('shows a webhook’s new secret once, with how a caller signs', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<Triggers agentId={AGENT_ID} />);
    await user.click(await view.findByRole('button', { name: 'New signing secret' }));
    expect(await view.findByRole('status')).toHaveTextContent(
      /never shown again\.whsec-shown-onceCallers send X-Zephyrex-Timestamp .* and X-Zephyrex-Signature/,
    );
  });

  it('makes a schedule, checking it first', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<Triggers agentId={AGENT_ID} />, store);
    await user.click(view.getByRole('button', { name: MAKE }));
    expect(await view.findByRole('alert')).toHaveTextContent('A schedule needs a cron expression');
    await user.type(view.getByLabelText('Cron expression'), '30 7 * * *');
    await user.type(view.getByLabelText('Instructions (optional)'), 'Read the news.');
    await user.selectOptions(view.getByLabelText('Priority'), '1 (most urgent)');
    await user.click(view.getByRole('button', { name: MAKE }));
    await vi.waitFor(() => {
      expect(store.triggers).toHaveLength(3);
    });
    expect(store.triggers.at(-1)).toMatchObject({ cron: '30 7 * * *', invocation_payload: 'Read the news.', priority: 1 });
    expect(view.getByLabelText('Cron expression')).toHaveValue('');
  });

  it('makes a timer that fires once, and an email trigger with its filter', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<Triggers agentId={AGENT_ID} />, store);
    await user.selectOptions(view.getByLabelText(FIRES), 'After a time');
    fireEvent.change(view.getByLabelText('First due (optional)'), { target: { value: '2026-10-06T09:00' } });
    await user.click(view.getByRole('button', { name: MAKE }));
    expect(await view.findByRole('alert')).toHaveTextContent('tick “Only once”');
    await user.click(view.getByLabelText('Only once'));
    await user.click(view.getByRole('button', { name: MAKE }));
    await vi.waitFor(() => {
      expect(store.triggers.at(-1)).toMatchObject({ invocation_type: 'timer', one_shot: true, interval_seconds: null });
    });
    await user.selectOptions(view.getByLabelText(FIRES), 'When something happens');
    await user.selectOptions(view.getByLabelText('When'), 'An email');
    await user.type(view.getByLabelText('From (an address or @domain; optional)'), '@example.com');
    await user.click(view.getByRole('button', { name: MAKE }));
    await vi.waitFor(() => {
      expect(store.triggers.at(-1)).toMatchObject({ event_source: 'email', event_filter: '{"from":"@example.com"}' });
    });
  });

  it('says when the agent has no triggers', async () => {
    const view = renderAgents(<Triggers agentId={AGENT_ID} />, { ...agentsFixture(), triggers: [] });
    expect(await view.findByText('No triggers: it takes turns only when asked.')).toBeInTheDocument();
  });
});
