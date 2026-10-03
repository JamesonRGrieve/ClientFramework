// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSocialPublications } from './socialApi';
import { renderSocial } from './testing.mocks';

function PostCount(): string {
  return `${String(useSocialPublications().data?.length ?? 0)} posts`;
}

describe('renderSocial', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the Zephyrex test app, answering the social routes from the given posts', async () => {
    const view = renderSocial(<PostCount />);
    expect(await view.findByText('3 posts')).toBeInTheDocument();
  });

  it('serves no posts when given none', async () => {
    const view = renderSocial(<PostCount />, []);
    expect(await view.findByText('0 posts')).toBeInTheDocument();
  });
});
