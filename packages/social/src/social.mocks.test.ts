// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { PUBLICATIONS, socialHandlers } from './social.mocks';

const BASE = 'http://localhost:1996';
const send = fetchFrom(socialHandlers());

describe('the mock social server', () => {
  it('lists every post in the server’s envelope, with no pagination', async () => {
    await expect((await send(`${BASE}/v1/social_publication`)).json()).resolves.toEqual({
      social_publications: PUBLICATIONS,
    });
  });

  it('answers one post, or 404 for one the caller can’t see', async () => {
    await expect((await send(`${BASE}/v1/social_publication/p2`)).json()).resolves.toEqual({
      social_publication: PUBLICATIONS[1],
    });
    expect((await send(`${BASE}/v1/social_publication/gone`)).status).toBe(404);
  });

  it('records media as null when a post has none, never as an empty list', () => {
    expect(PUBLICATIONS.map(({ media_urls: media }) => media)).toEqual([null, ['https://cdn.example.com/studio.jpg'], null]);
  });
});
