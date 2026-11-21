// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import type { RoomChange } from './roomsModel';
import { useRoom } from './useRoom';

const SCENE = { type: 'scene', id: 's1' };
const HTTP_NOT_FOUND = 404;

const change = (id: string, op: RoomChange['op'] = 'updated'): RoomChange => ({
  id,
  room: SCENE,
  record: { type: 'token', id: `t-${id}` },
  op,
  etag: `W/"${id}"`,
  changed_at: '2026-11-21T17:00:00Z',
});

/** An EventSource stand-in: the test opens it, sends it events and fails it. */
class FakeEventSource extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static opened: FakeEventSource[] = [];
  readyState = FakeEventSource.CONNECTING;
  constructor(
    readonly url: string,
    readonly init?: EventSourceInit,
  ) {
    super();
    FakeEventSource.opened.push(this);
  }
  close(): void {
    this.readyState = FakeEventSource.CLOSED;
  }
  open(): void {
    this.readyState = FakeEventSource.OPEN;
    this.dispatchEvent(new Event('open'));
  }
  send(type: string, data: object, lastEventId = ''): void {
    this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data), lastEventId }));
  }
  refuse(): void {
    this.readyState = FakeEventSource.CLOSED;
    this.dispatchEvent(new Event('error'));
  }
}

const latest = (): FakeEventSource => {
  const source = FakeEventSource.opened.at(-1);
  if (source === undefined) {
    throw new Error('The test expected an open stream');
  }
  return source;
};

/** A fetch whose /changes answers come from `answer`; anything else is the app shell's empty read. */
function stubChanges(answer: (url: URL) => Response): ReturnType<typeof vi.fn> {
  const fetching = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    return Promise.resolve(url.pathname.endsWith('/changes') ? answer(url) : Response.json({}));
  });
  vi.stubGlobal('fetch', fetching);
  return fetching;
}

describe('useRoom', () => {
  beforeEach(() => {
    FakeEventSource.opened = [];
    withSession();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('streams each change once, with the session’s credentials, and goes live', async () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    stubChanges(() => Response.json({}));
    const seen = vi.fn();
    const { result } = renderHook(() => useRoom(SCENE, seen), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(FakeEventSource.opened).toHaveLength(1);
    });
    const source = latest();
    expect(source.url).toBe('http://localhost:1996/v1/room/scene/s1/events');
    expect(source.init).toEqual({ withCredentials: true });
    act(() => {
      source.open();
      source.send('change', change('c1'), 'c1');
      source.send('change', change('c1'), 'c1');
      source.send('change', change('c2', 'deleted'), 'c2');
    });
    expect(result.current).toBe('live');
    expect(seen.mock.calls.map(([one]: [RoomChange]) => [one.id, one.op])).toEqual([
      ['c1', 'updated'],
      ['c2', 'deleted'],
    ]);
  });

  it('asks for a fresh read on reset, and stops for good when revoked', async () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    stubChanges(() => Response.json({}));
    const onReset = vi.fn();
    const { result } = renderHook(() => useRoom(SCENE, vi.fn(), { onReset }), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(FakeEventSource.opened).toHaveLength(1);
    });
    act(() => {
      latest().send('reset', { reason: 'cursor expired' });
      latest().send('revoked', { room: SCENE });
    });
    expect(onReset).toHaveBeenCalledWith('cursor expired');
    expect(result.current).toBe('revoked');
    expect(latest().readyState).toBe(FakeEventSource.CLOSED);
  });

  it('falls back to polling when the stream is refused, and stops on a room that isn’t there', async () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    stubChanges(() => Response.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND }));
    const { result } = renderHook(() => useRoom(SCENE, vi.fn()), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(FakeEventSource.opened).toHaveLength(1);
    });
    act(() => {
      latest().refuse();
    });
    await waitFor(() => {
      expect(result.current).toBe('missing');
    });
  });

  it('polls from the latest change, hands on what follows, and resets when the cursor is gone', async () => {
    const pages = [
      { changes: [], next: 'c0' },
      { changes: [change('c1')], next: 'c1' },
      { changes: [], next: 'c9', reset: true },
    ];
    const asked: string[] = [];
    stubChanges((url) => {
      asked.push(url.searchParams.get('after') ?? '');
      return Response.json(pages.shift() ?? { changes: [], next: 'c9' });
    });
    const seen = vi.fn();
    const onReset = vi.fn();
    const { result, unmount } = renderHook(() => useRoom(SCENE, seen, { transport: 'poll', pollIntervalMs: 5, onReset }), {
      wrapper: TestWrapper,
    });
    await waitFor(() => {
      expect(onReset).toHaveBeenCalledOnce();
    });
    expect(result.current).toBe('polling');
    expect(seen.mock.calls.map(([one]: [RoomChange]) => one.id)).toEqual(['c1']);
    expect(asked.slice(0, 3)).toEqual(['', 'c0', 'c1']);
    unmount();
  });

  it('stays off with no room, or when disabled', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    const fetching = stubChanges(() => Response.json({}));
    const none = renderHook(() => useRoom(null, vi.fn()), { wrapper: TestWrapper });
    const disabled = renderHook(() => useRoom(SCENE, vi.fn(), { enabled: false }), { wrapper: TestWrapper });
    expect([none.result.current, disabled.result.current]).toEqual(['off', 'off']);
    expect(FakeEventSource.opened).toHaveLength(0);
    expect(fetching.mock.calls.filter(([input]) => String(input).includes('/changes'))).toHaveLength(0);
  });
});
