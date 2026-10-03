// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicationPage } from './PublicationPage';
import { PUBLICATIONS } from './social.mocks';
import { renderSocial } from './testing.mocks';

const BACK = 'Back to the social posts';
/** Addresses that would run script if linked. */
const SCRIPTED_PAGE = 'data:text/html,<script>alert(1)</script>';
const SCRIPTED_MEDIA = 'data:image/svg+xml,<svg onload="alert(2)"/>';

describe('PublicationPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the whole post, its media and the link to it on the platform', async () => {
    const view = renderSocial(<PublicationPage params={{ publicationId: 'p2' }} />);
    expect(await view.findByRole('heading', { name: 'Threads post' })).toBeInTheDocument();
    expect(view.getByText('Behind the scenes at the studio.')).toBeInTheDocument();
    const media = view.getByRole('link', { name: 'https://cdn.example.com/studio.jpg' });
    expect(media).toHaveAttribute('target', '_blank');
    expect(media).toHaveAttribute('rel', 'noopener noreferrer');
    expect(view.getByRole('link', { name: 'View on Threads' })).toHaveAttribute(
      'href',
      'https://threads.example.com/posts/p2',
    );
    expect(view.getByRole('link', { name: BACK })).toHaveAttribute('href', '/social');
  });

  it('shows no media section or platform link when the post has neither', async () => {
    const view = renderSocial(<PublicationPage params={{ publicationId: 'p3' }} />);
    expect(await view.findByRole('heading', { name: 'X post' })).toBeInTheDocument();
    expect(view.queryByRole('region', { name: 'Media' })).toBeNull();
    expect(view.queryByRole('link', { name: /^View on/ })).toBeNull();
  });

  it('shows, but never links, an address that is not http(s)', async () => {
    const unsafe = PUBLICATIONS.map((post) => ({ ...post, url: SCRIPTED_PAGE, media_urls: [SCRIPTED_MEDIA] }));
    const view = renderSocial(<PublicationPage params={{ publicationId: 'p1' }} />, unsafe);
    expect(await view.findByText('View on X')).toBeInTheDocument();
    expect(view.queryByRole('link', { name: 'View on X' })).toBeNull();
    expect(view.getByText(SCRIPTED_MEDIA).closest('a')).toBeNull();
  });

  it('says when the post does not exist or is not the user’s to see', async () => {
    const view = renderSocial(<PublicationPage params={{ publicationId: 'gone' }} />);
    expect(await view.findByText('This post does not exist, or is not yours to see.')).toBeInTheDocument();
    expect(view.getByRole('link', { name: BACK })).toBeInTheDocument();
  });
});
