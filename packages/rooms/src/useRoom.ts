// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, useClient } from 'zephyrex';
import {
  MAX_CHANGES_PAGE,
  ResetSchema,
  type RoomChange,
  RoomChangePageSchema,
  RoomChangeSchema,
  type RoomRef,
  roomPath,
} from './roomsModel';

const HTTP_NOT_FOUND = 404;
/** How often the polling fallback asks when there is no stream. */
export const POLL_INTERVAL_MS = 5000;
/** How many change ids are remembered, so a change replayed after a reconnect is handed on once. */
const SEEN_LIMIT = 1000;

/**
 * Where the room stands: `live` on the stream, `polling` on the fallback, `revoked` once the user
 * may no longer see the room, `missing` for a room that isn't there (or isn't theirs to see), `off`
 * with no room or when disabled.
 */
export type RoomStatus = 'connecting' | 'live' | 'polling' | 'revoked' | 'missing' | 'off';

export interface RoomOptions {
  /** The changes since the last one handed on are gone: refetch the room's data. */
  onReset?: (reason: string) => void;
  /** false: don't join (the server lists no rooms extension, or the page isn't showing the room). */
  enabled?: boolean;
  /** `poll` skips the stream and asks every `pollIntervalMs`. */
  transport?: 'auto' | 'poll';
  pollIntervalMs?: number;
}

/** A message event's JSON payload, or null when it isn't one. */
function payload(event: Event): string | null {
  return event instanceof MessageEvent && typeof event.data === 'string' ? event.data : null;
}

/**
 * Joins a record's room and hands each change to `onChange` once, in order: over server-sent events
 * (the browser reconnects and catches up by Last-Event-ID), or by polling `/changes` when the stream
 * can't be had. A change names the record, never its data; refetch it through its own API, or drop
 * it on `deleted`. Stops for good on `revoked` or a 404.
 */
export function useRoom(
  room: RoomRef | null,
  onChange: (change: RoomChange) => void,
  { onReset, enabled = true, transport = 'auto', pollIntervalMs = POLL_INTERVAL_MS }: RoomOptions = {},
): RoomStatus {
  const client = useClient();
  const changeRef = useRef(onChange);
  const resetRef = useRef(onReset);
  const [status, setStatus] = useState<RoomStatus>('connecting');
  useEffect(() => {
    changeRef.current = onChange;
    resetRef.current = onReset;
  }, [onChange, onReset]);

  const type = room?.type;
  const id = room?.id;
  useEffect(() => {
    if (type === undefined || id === undefined || !enabled) {
      return undefined;
    }
    const path = roomPath({ type, id });
    let stopped = false;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cursor: string | null = null;
    let started = false;
    const seen = new Set<string>();

    const show = (next: RoomStatus): void => {
      if (!stopped) {
        setStatus(next);
      }
    };
    const stop = (final: RoomStatus): void => {
      show(final);
      stopped = true;
      source?.close();
      clearTimeout(timer);
    };
    const reset = (reason: string): void => {
      resetRef.current?.(reason);
    };
    const deliver = (change: RoomChange): void => {
      cursor = change.id;
      if (seen.has(change.id)) {
        return;
      }
      seen.add(change.id);
      if (seen.size > SEEN_LIMIT) {
        // A Set keeps insertion order: the first id is the oldest.
        const oldest = seen.values().next().value;
        if (oldest !== undefined) {
          seen.delete(oldest);
        }
      }
      changeRef.current(change);
    };
    // One polling step: where to start, then each page after the cursor (a full page is followed at once).
    const poll = async (): Promise<void> => {
      const schedule = (delay: number): void => {
        if (!stopped) {
          timer = setTimeout(() => void poll(), delay);
        }
      };
      try {
        const query: Record<string, string> = cursor === null ? {} : { after: cursor, limit: String(MAX_CHANGES_PAGE) };
        const page = RoomChangePageSchema.parse(await client.get(`${path}/changes`, query));
        if (stopped) {
          return;
        }
        if (cursor === null) {
          // An empty room has no cursor yet; once one appears, what came before it was missed.
          if (started && page.next !== null) {
            reset('The room changed before it could be followed');
          }
          started = true;
          cursor = page.next;
        } else if (page.reset) {
          cursor = page.next;
          reset('The changes since the last check are no longer kept');
        } else {
          page.changes.forEach(deliver);
          cursor = page.next ?? cursor;
          if (page.changes.length === MAX_CHANGES_PAGE) {
            schedule(0);
            return;
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
          stop('missing');
          return;
        }
      }
      schedule(pollIntervalMs);
    };
    const startPolling = (): void => {
      show('polling');
      void poll();
    };
    const startStream = (): void => {
      show('connecting');
      const stream = new EventSource(client.url(`${path}/events`), { withCredentials: true });
      source = stream;
      stream.addEventListener('open', () => show('live'));
      stream.addEventListener('change', (event) => {
        const data = payload(event);
        const change = data === null ? null : RoomChangeSchema.safeParse(JSON.parse(data));
        if (change?.success === true) {
          deliver(change.data);
        }
      });
      stream.addEventListener('reset', (event) => {
        const data = payload(event);
        const parsed = data === null ? null : ResetSchema.safeParse(JSON.parse(data));
        reset(parsed?.success === true ? parsed.data.reason : 'The room asked for a fresh read');
      });
      stream.addEventListener('revoked', () => stop('revoked'));
      // The browser retries a dropped stream itself; a refused one (an error status) ends CLOSED.
      stream.addEventListener('error', () => {
        if (stream.readyState === EventSource.CLOSED && !stopped) {
          source = null;
          startPolling();
        }
      });
    };

    if (transport === 'poll' || typeof EventSource === 'undefined') {
      startPolling();
    } else {
      startStream();
    }
    return (): void => {
      stopped = true;
      source?.close();
      clearTimeout(timer);
    };
  }, [client, type, id, enabled, transport, pollIntervalMs]);

  return type === undefined || id === undefined || !enabled ? 'off' : status;
}
