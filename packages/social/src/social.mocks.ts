// SPDX-License-Identifier: AGPL-3.0-or-later
// The social server's routes for the package's tests and stories (never compiled into dist): the
// read-only publication list and detail, over a few posts.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { SOCIAL_PUBLICATION_ENDPOINT, type SocialPublication } from './socialApi';

const HTTP_NOT_FOUND = 404;

const post = (
  id: string,
  provider: string,
  content: string,
  publishedAt: string,
  extra: Partial<SocialPublication> = {},
): SocialPublication => ({
  id,
  provider,
  provider_instance_id: `account-${provider}`,
  platform_post_id: `${provider}-${id}`,
  url: `https://${provider}.example.com/posts/${id}`,
  content,
  media_urls: null,
  published_at: publishedAt,
  created_at: publishedAt,
  ...extra,
});

/** Three posts on two platforms, oldest first as a server might store them. */
export const PUBLICATIONS: readonly SocialPublication[] = [
  post('p1', 'x', 'Our first post.', '2026-09-01T09:00:00Z'),
  post('p2', 'threads', 'Behind the scenes at the studio.', '2026-09-15T12:30:00Z', {
    media_urls: ['https://cdn.example.com/studio.jpg'],
  }),
  post('p3', 'x', 'Launch day! Everything we built this summer is live now.', '2026-09-30T16:00:00Z', { url: null }),
];

/** GET list and GET by id, as the server answers them (404 for a post the caller can't see). */
export function socialHandlers(publications: readonly SocialPublication[] = PUBLICATIONS): RequestHandler[] {
  return [
    http.get(`*${SOCIAL_PUBLICATION_ENDPOINT}`, () => HttpResponse.json({ social_publications: publications })),
    http.get(`*${SOCIAL_PUBLICATION_ENDPOINT}/:id`, ({ params }) => {
      const found = publications.find(({ id }) => id === params['id']);
      return found === undefined
        ? HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND })
        : HttpResponse.json({ social_publication: found });
    }),
  ];
}
