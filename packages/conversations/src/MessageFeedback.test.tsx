// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { conversationsFixture, ME } from './conversations.mocks';
import { MessageFeedback, ratingLabel } from './MessageFeedback';
import { renderConversations } from './testing.mocks';

const HELPFUL = 'Helpful';
const NOT_HELPFUL = 'Not helpful';
const PRESSED = 'aria-pressed';

describe('ratingLabel', () => {
  it('says a rating as the user would', () => {
    expect([true, false, null, undefined].map(ratingLabel)).toEqual([HELPFUL, NOT_HELPFUL, 'No rating', 'No rating']);
  });
});

describe('MessageFeedback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the rating the user gave, and changes it to the other', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(<MessageFeedback messageId='m3' />, store);
    await vi.waitFor(() => {
      expect(view.getByRole('button', { name: HELPFUL })).toHaveAttribute(PRESSED, 'true');
    });
    await user.click(view.getByRole('button', { name: NOT_HELPFUL }));
    await vi.waitFor(() => {
      expect(view.getByRole('button', { name: NOT_HELPFUL })).toHaveAttribute(PRESSED, 'true');
    });
    expect(store.feedbacks.find(({ id }) => id === 'f1')?.positive).toBe(false);
  });

  it('withdraws the rating when the one given is chosen again', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(<MessageFeedback messageId='m3' />, store);
    await vi.waitFor(() => {
      expect(view.getByRole('button', { name: HELPFUL })).toHaveAttribute(PRESSED, 'true');
    });
    await user.click(view.getByRole('button', { name: HELPFUL }));
    await vi.waitFor(() => {
      expect(view.getByRole('button', { name: HELPFUL })).toHaveAttribute(PRESSED, 'false');
    });
    expect(store.feedbacks).toEqual([]);
  });

  it('rates a message the user has not rated yet', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(<MessageFeedback messageId='m1' />, store);
    await user.click(await view.findByRole('button', { name: HELPFUL }));
    await vi.waitFor(() => {
      expect(view.getByRole('button', { name: HELPFUL })).toHaveAttribute(PRESSED, 'true');
    });
    expect(store.feedbacks.at(-1)).toMatchObject({ message_id: 'm1', positive: true, user_id: ME.id });
  });

  it('keeps the user’s rating beside the one stored when it changed since it was loaded', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(<MessageFeedback messageId='m3' />, store);
    await vi.waitFor(() => {
      expect(view.getByRole('button', { name: HELPFUL })).toHaveAttribute(PRESSED, 'true');
    });
    store.feedbacks = store.feedbacks.map((row) => ({ ...row, positive: null, updated_at: '2026-10-02T08:00:00.000001' }));
    await user.click(view.getByRole('button', { name: NOT_HELPFUL }));
    expect(await view.findByRole('radio', { name: 'Current: No rating' })).not.toBeChecked();
  });
});
