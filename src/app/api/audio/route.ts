// SPDX-License-Identifier: AGPL-3.0-or-later
// app/api/audio/route.js
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) return new Response('Missing URL', { status: 400 });

  const response = await fetch(url, {
    headers: {
      Accept: 'audio/wav,audio/*',
    },
  });

  if (!response.ok) {
    return new Response(`Failed to fetch audio: ${response.statusText}`, {
      status: response.status,
    });
  }

  const blob = await response.blob();
  const headers = new Headers();
  headers.set('Content-Type', response.headers.get('Content-Type') || 'audio/wav');
  headers.set('Content-Length', blob.size.toString());

  return new Response(blob, { headers });
}
