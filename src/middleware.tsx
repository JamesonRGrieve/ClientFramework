import { type NextRequest, NextResponse } from 'next/server';
import { useAuth, useJWTQueryParam, useOAuth2 } from '@jgrieve/auth/auth.middleware';
import type { MiddlewareHook } from '@jgrieve/auth/types/MiddlewareHook';
import { getRequestedURI } from '@jgrieve/auth/utils';
import log from '@/lib/log';

//import assert from 'assert';

type JsonObject = { [key: string]: JsonValue };
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export const mergeConfigs = (obj1: JsonObject, obj2: JsonObject): JsonObject =>
  Object.keys(obj2).reduce<JsonObject>(
    (acc, key) => {
      const left = obj1[key];
      const right = obj2[key];
      acc[key] =
        typeof right === 'object' &&
        right !== null &&
        !Array.isArray(right) &&
        typeof left === 'object' &&
        left !== null &&
        !Array.isArray(left)
          ? mergeConfigs(left, right)
          : right;
      return acc;
    },
    { ...obj1 },
  );

export const useNextAPIBypass: MiddlewareHook = async (req) => {
  const toReturn = {
    activated: false,
    response: NextResponse.next(),
  };
  if (
    req.nextUrl.pathname.startsWith('/_next/') ||
    req.nextUrl.pathname.startsWith('/api/') ||
    req.nextUrl.pathname === '/favicon.ico'
  ) {
    toReturn.activated = true;
  }
  return toReturn;
};

export const useSocketIOBypass: MiddlewareHook = async (req) => {
  const url = new URL(getRequestedURI(req));

  return {
    activated: url.host === 'socket.io',
    response: NextResponse.next(),
  };
};

export default async function Middleware(req: NextRequest): Promise<NextResponse> {
  log([`MIDDLEWARE INVOKED AT ${req.nextUrl.pathname}`], {
    server: 1,
  });
  const hooks = [useNextAPIBypass, useOAuth2, useJWTQueryParam, useAuth];
  for (const hook of hooks) {
    const hookResult = await hook(req);
    if (hookResult.activated) {
      hookResult.response.headers.set('x-next-pathname', req.nextUrl.pathname);
      return hookResult.response;
    }
  }
  return NextResponse.next({
    headers: {
      'x-next-pathname': req.nextUrl.pathname,
    },
  });
}
