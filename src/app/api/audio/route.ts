// SPDX-License-Identifier: AGPL-3.0-or-later
// The session module, not the package root: a route handler runs server-side, and the root also
// exports the client hooks.
import { SESSION_COOKIE } from '@zephyrex/auth/lib/session';
import type { NextRequest } from 'next/server.js';
import { apiBaseFor } from '@/lib/zephyrex/createMiddleware';
import config from '@/zephyrex.config';

const IPV4_OCTETS = 4;
const OCTET_BITS = 8;
const OCTET_MAX = 255;
const IPV4_BITS = IPV4_OCTETS * OCTET_BITS;
const DECIMAL_OCTET = /^\d{1,3}$/;

/** Addresses the proxy must never reach: this host, private networks, carrier NAT and link-local. */
const PRIVATE_IPV4_CIDRS = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.168.0.0/16',
] as const;

/** A dotted-quad IPv4 address as an unsigned integer, or null when it is not one. */
function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== IPV4_OCTETS) {
    return null;
  }
  let result = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!DECIMAL_OCTET.test(part) || n > OCTET_MAX) {
      return null;
    }
    result = (result << OCTET_BITS) | n;
  }
  return result >>> 0;
}

function cidrRange(cidr: string): readonly [number, number] {
  const [base = '', prefix = ''] = cidr.split('/');
  const start = ipToInt(base);
  if (start === null) {
    throw new Error(`Not an IPv4 CIDR: ${cidr}`);
  }
  return [start, start + 2 ** (IPV4_BITS - Number(prefix)) - 1];
}

const PRIVATE_IPV4_RANGES = PRIVATE_IPV4_CIDRS.map(cidrRange);

function isPrivateIP(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') {
    return true;
  }
  if (hostname.startsWith('[')) {
    return true;
  }

  const ip = ipToInt(hostname);
  if (ip === null) {
    return false;
  }
  for (const [start, end] of PRIVATE_IPV4_RANGES) {
    if (ip >= start && ip <= end) {
      return true;
    }
  }
  return false;
}

const BLOCKED_HOSTNAMES = new Set(['metadata.google.internal', 'kubernetes.default.svc', 'host.docker.internal']);

function validateUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }
  if (isPrivateIP(parsed.hostname)) {
    return null;
  }
  if (BLOCKED_HOSTNAMES.has(parsed.hostname)) {
    return null;
  }

  const allowedHosts = process.env.AUDIO_PROXY_ALLOWED_HOSTS;
  if (allowedHosts !== undefined && allowedHosts !== '') {
    const allowed = new Set(allowedHosts.split(',').map((h) => h.trim()));
    if (!allowed.has(parsed.hostname)) {
      return null;
    }
  }

  return parsed;
}

/** Whether the request carries a session the API accepts. */
async function hasLiveSession(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session === undefined || session === '') {
    return false;
  }
  try {
    const response = await fetch(`${apiBaseFor(config)}/v1/user`, {
      headers: { Cookie: `${SESSION_COOKIE}=${session}` },
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  if (!(await hasLiveSession(request))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get('url');
  if (raw === null || raw === '') {
    return new Response('Missing URL', { status: 400 });
  }

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
      'Content-Type': response.headers.get('Content-Type') ?? 'audio/wav',
      'Content-Length': blob.size.toString(),
      'Cache-Control': 'no-store',
    },
  });
}
