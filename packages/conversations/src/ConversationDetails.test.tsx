// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { ConversationDetails, detailsChanges } from './ConversationDetails';
import { conversationsFixture } from './conversations.mocks';
import { renderConversations } from './testing.mocks';

const SAVE = 'Save details';
const NEW_NAME = 'The Engine';

describe('detailsChanges', () => {
  const plans = rowOf(conversationsFixture().conversations, 'plans');

  it('keeps only what changed, trimmed, a blank description being none', () => {
    expect(detailsChanges(plans, { name: ' Engine plans ', description: '' })).toEqual({});
    expect(detailsChanges(plans, { name: 'Engine', description: ' Tuesdays ' })).toEqual({
      name: 'Engine',
      description: 'Tuesdays',
    });
    expect(detailsChanges({ ...plans, description: 'Old' }, { name: 'Engine plans', description: '' })).toEqual({
      description: null,
    });
  });
});

describe('ConversationDetails', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renames a group chat', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(
      <ConversationDetails conversation={rowOf(store.conversations, 'plans')} viewerOwns />,
      store,
    );
    const name = view.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, NEW_NAME);
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(rowOf(store.conversations, 'plans').name).toBe(NEW_NAME);
  });

  it('says when there is nothing to save, and asks for a name', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(
      <ConversationDetails conversation={rowOf(store.conversations, 'plans')} viewerOwns />,
      store,
    );
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Nothing to save.');
    await user.clear(view.getByLabelText('Name'));
    view.getByLabelText('Name').removeAttribute('required');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Give the chat a name.');
  });

  it('keeps the user’s name beside the chat as it is now when someone renamed it first', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(
      <ConversationDetails conversation={rowOf(store.conversations, 'plans')} viewerOwns />,
      store,
    );
    store.conversations = store.conversations.map((row) =>
      row.id === 'plans' ? { ...row, name: 'Renamed first', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const name = view.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, NEW_NAME);
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('radio', { name: 'Current: Renamed first' })).not.toBeChecked();
  });

  it('lets the owner delete the conversation, then goes back to the conversations', async () => {
    const store = conversationsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderConversations(
      <ConversationDetails conversation={rowOf(store.conversations, 'plans')} viewerOwns />,
      store,
    );
    await user.click(view.getByRole('button', { name: 'Delete conversation' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/conversations');
    });
    expect(store.conversations.some(({ id }) => id === 'plans')).toBe(false);
  });

  it('shows a direct conversation no details and someone else’s no delete', () => {
    const store = conversationsFixture();
    const direct = renderConversations(
      <ConversationDetails conversation={rowOf(store.conversations, 'dm-charles')} viewerOwns={false} />,
      store,
    );
    expect(direct.queryByRole('form', { name: 'Chat details' })).toBeNull();
    expect(direct.queryByRole('button', { name: 'Delete conversation' })).toBeNull();
  });
});
