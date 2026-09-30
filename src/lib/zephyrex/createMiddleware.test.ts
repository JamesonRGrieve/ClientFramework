// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server.js';
import { describe, expect, it } from 'vitest';
import { createMiddleware } from './createMiddleware';
import type { MiddlewareHook } from './types';

const request = (): NextRequest => new NextRequest('https://app.example.com/team/1');

const recording =
  (log: string[], name: string, activated = false): MiddlewareHook =>
  async () => {
    log.push(name);
    return Promise.resolve({ activated, response: NextResponse.redirect('https://app.example.com/elsewhere') });
  };

describe('createMiddleware', () => {
  it('runs built-in, app, then extension hooks in order and continues when none activates', async () => {
    const log: string[] = [];
    const middleware = createMiddleware({
      builtinHooks: [recording(log, 'builtin')],
      hooks: [recording(log, 'app')],
      extensions: [{ name: 'ext', middleware: [recording(log, 'extension')] }],
    });
    const response = await middleware(request());
    expect(log).toEqual(['builtin', 'app', 'extension']);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('x-next-pathname')).toBe('/team/1');
  });

  it('answers with the first activating hook and skips the rest', async () => {
    const log: string[] = [];
    const middleware = createMiddleware({
      builtinHooks: [],
      hooks: [recording(log, 'first', true)],
      extensions: [{ name: 'ext', middleware: [recording(log, 'never')] }],
    });
    const response = await middleware(request());
    expect(log).toEqual(['first']);
    expect(response.headers.get('location')).toBe('https://app.example.com/elsewhere');
    expect(response.headers.get('x-next-pathname')).toBe('/team/1');
  });

  it('lets a throwing hook fail the request instead of silently skipping auth', async () => {
    const failing: MiddlewareHook = async () => Promise.reject(new Error('boom'));
    const middleware = createMiddleware({ builtinHooks: [failing] });
    await expect(middleware(request())).rejects.toThrow('boom');
  });
});
