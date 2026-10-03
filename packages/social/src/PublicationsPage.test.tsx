// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { PublicationsPage } from './PublicationsPage';
import { PUBLICATIONS } from './social.mocks';
import { renderSocial } from './testing.mocks';

const POSTS = 'Social posts';
const HTTP_UNAVAILABLE = 503;
/** Long enough to pass the excerpt length. */
const LONG_POST_WORDS = 60;

describe('PublicationsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the posts newest first, each linking to its page', async () => {
    const view = renderSocial(<PublicationsPage />);
    const list = await view.findByRole('list', { name: POSTS });
    const links = within(list).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/social/p3', '/social/p2', '/social/p1']);
    expect(links.map((link) => link.textContent)).toEqual(['X', 'Threads', 'X']);
  });

  it('shortens a long post to an excerpt', async () => {
    const long = PUBLICATIONS.map((post) => ({ ...post, content: 'word '.repeat(LONG_POST_WORDS) }));
    const view = renderSocial(<PublicationsPage />, long);
    const list = await view.findByRole('list', { name: POSTS });
    expect(within(list).getAllByText(/…$/)).toHaveLength(long.length);
  });

  it('filters by platform', async () => {
    const user = userEvent.setup();
    const view = renderSocial(<PublicationsPage />);
    await view.findByRole('list', { name: POSTS });
    await user.selectOptions(view.getByLabelText('Platform'), 'threads');
    const list = view.getByRole('list', { name: POSTS });
    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Threads']);
  });

  it('offers no platform filter when every post is on one platform', async () => {
    const view = renderSocial(
      <PublicationsPage />,
      PUBLICATIONS.filter(({ provider }) => provider === 'x'),
    );
    await view.findByRole('list', { name: POSTS });
    expect(view.queryByLabelText('Platform')).toBeNull();
  });

  it('says when nothing has been posted', async () => {
    const view = renderSocial(<PublicationsPage />, []);
    expect(await view.findByText('Nothing has been posted yet.')).toBeInTheDocument();
  });

  it('says why the posts could not be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{"detail":"Server unavailable"}', { status: HTTP_UNAVAILABLE }))),
    );
    const view = render(
      <TestWrapper>
        <PublicationsPage />
      </TestWrapper>,
    );
    expect(await view.findByRole('alert')).toHaveTextContent('The posts could not be loaded: Server unavailable');
  });
});
