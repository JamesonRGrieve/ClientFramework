// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { genealogyHandlers } from './genealogy.mocks';
import { StartWithYou } from './StartWithYou';

const USER = { id: 'user-1', email: 'sam@example.com', first_name: 'Sam', last_name: 'Rivera' };

describe('StartWithYou', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'zx_csrf=; path=/; max-age=0';
  });

  it('adds the user as themselves, linked to their account, in one press', async () => {
    const store = { persons: [], relationships: [] };
    const started = vi.fn(() => Promise.resolve());
    // A session, as far as the client can tell: its readable CSRF cookie.
    document.cookie = 'zx_csrf=csrf-1; path=/';
    vi.stubGlobal(
      'fetch',
      vi.fn(fetchFrom([http.get('*/v1/user', () => HttpResponse.json({ user: USER })), ...genealogyHandlers(store)])),
    );
    const view = render(
      <TestWrapper>
        <StartWithYou onStarted={started} />
      </TestWrapper>,
    );
    expect(view.getByRole('heading', { name: 'Start your map with you' })).toBeInTheDocument();
    await userEvent.setup().click(await view.findByRole('button', { name: 'Add myself' }));
    await vi.waitFor(() => {
      expect(started).toHaveBeenCalled();
    });
    expect(store.persons).toMatchObject([{ name: 'Sam Rivera', linked_user_id: 'user-1' }]);
  });

  it('takes the page’s own heading and words', () => {
    const view = render(
      <TestWrapper>
        <StartWithYou onStarted={vi.fn()} heading='Start with you' description='Add yourself first.' />
      </TestWrapper>,
    );
    expect(view.getByRole('heading', { name: 'Start with you' })).toBeInTheDocument();
    expect(view.getByText('Add yourself first.')).toBeInTheDocument();
  });
});
