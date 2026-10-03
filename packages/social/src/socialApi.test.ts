// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper as wrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { socialHandlers } from './social.mocks';
import { linkTarget, platformName, useSocialPublication, useSocialPublications } from './socialApi';

const HTTP_UNAVAILABLE = 503;

describe('the social publication reads', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the posts newest first', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchFrom(socialHandlers())));
    const { result } = renderHook(() => useSocialPublications().data, { wrapper });
    await waitFor(() => {
      expect(result.current?.map(({ id }) => id)).toEqual(['p3', 'p2', 'p1']);
    });
  });

  it('reads one post, and a post that is missing or not the user’s as null', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchFrom(socialHandlers())));
    const found = renderHook(() => useSocialPublication('p2').data, { wrapper });
    await waitFor(() => {
      expect(found.result.current?.provider).toBe('threads');
    });
    const missing = renderHook(() => useSocialPublication('gone'), { wrapper });
    await waitFor(() => {
      expect(missing.result.current.data).toBeNull();
    });
    expect(missing.result.current.error).toBeUndefined();
  });

  it('reports a failure other than not found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{"detail":"Server unavailable"}', { status: HTTP_UNAVAILABLE }))),
    );
    const { result } = renderHook(() => useSocialPublication('p1').error, { wrapper });
    await waitFor(() => {
      expect(result.current?.message).toBe('Server unavailable');
    });
  });
});

describe('platformName', () => {
  it('names the six platforms, and shows an unknown provider as the server names it', () => {
    expect(['x', 'facebook', 'instagram', 'threads', 'tiktok', 'postiz', 'mastodon'].map(platformName)).toEqual([
      'X',
      'Facebook',
      'Instagram',
      'Threads',
      'TikTok',
      'Postiz',
      'mastodon',
    ]);
  });
});

describe('linkTarget', () => {
  it('links only http(s) addresses: an allow-list, so every other scheme is refused', () => {
    expect(linkTarget('https://x.example.com/p/1')).toBe('https://x.example.com/p/1');
    expect(linkTarget('http://cdn.example.com/a.jpg')).toBe('http://cdn.example.com/a.jpg');
    expect(linkTarget('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(linkTarget('vbscript:msgbox(1)')).toBeNull();
    expect(linkTarget('file:///etc/passwd')).toBeNull();
    expect(linkTarget('not a url')).toBeNull();
  });
});
