// SPDX-License-Identifier: AGPL-3.0-or-later
import type { NextRequest } from 'next/server';

const PRIVATE_IPV4_RANGES = [
  [0x7f000000, 0x7fffffff], // 127.0.0.0/8
  [0x0a000000, 0x0affffff], // 10.0.0.0/8
  [0xac100000, 0xac1fffff], // 172.16.0.0/12
  [0xc0a80000, 0xc0a8ffff], // 192.168.0.0/16
  [0xa9fe0000, 0xa9feffff], // 169.254.0.0/16
  [0x00000000, 0x00000000], // 0.0.0.0
] as const;

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = Number(part);
    if (Number.isNaN(n) || n < 0 || n > 255) return null;
    result = (result << 8) | n;
  }
  return result >>> 0;
}

function isPrivateIP(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true;
  if (hostname.startsWith('[')) return true;

  const ip = ipToInt(hostname);
  if (ip === null) return false;
  for (const [start, end] of PRIVATE_IPV4_RANGES) {
    if (ip >= start && ip <= end) return true;
  }
  return false;
}

const BLOCKED_HOSTNAMES = new Set([
  'metadata.google.internal',
  'kubernetes.default.svc',
  'host.docker.internal',
]);

function validateUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (isPrivateIP(parsed.hostname)) return null;
  if (BLOCKED_HOSTNAMES.has(parsed.hostname)) return null;

  const allowedHosts = process.env['AUDIO_PROXY_ALLOWED_HOSTS'];
  if (allowedHosts) {
    const allowed = new Set(allowedHosts.split(',').map((h) => h.trim()));
    if (!allowed.has(parsed.hostname)) return null;
  }

  return parsed;
}

export async function GET(request: NextRequest): Promise<Response> {
  const jwt = request.cookies.get('jwt')?.value ?? request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return new Response('Unauthorized', { status: 401 });

  const raw = new URL(request.url).searchParams.get('url');
  if (!raw) return new Response('Missing URL', { status: 400 });

  const validated = validateUrl(raw);
  if (!validated) {
    return new Response('Forbidden: URL not allowed', { status: 403 });
  }

  const response = await fetch(validated.toString(), {
    headers: { Accept: 'audio/wav,audio/*' },
    redirect: 'error',
  });

  if (!response.ok) {
    return new Response(`Failed to fetch audio: ${response.statusText}`, {
      status: response.status,
    });
  }

  const blob = await response.blob();
  return new Response(blob, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/wav',
      'Content-Length': blob.size.toString(),
      'Cache-Control': 'no-store',
    },
  });
}
