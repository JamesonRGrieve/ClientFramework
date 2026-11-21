// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { RoomChangePageSchema, RoomChangeSchema, roomPath } from './roomsModel';

const CHANGE = {
  id: 'c1',
  room: { type: 'scene', id: 's1' },
  record: { type: 'token', id: 't1' },
  op: 'updated',
  etag: 'W/"2"',
  changed_at: '2026-11-21T17:00:00Z',
};

describe('the rooms model', () => {
  it('reads a change and a polling page as the server sends them', () => {
    expect(RoomChangeSchema.parse(CHANGE).record).toEqual({ type: 'token', id: 't1' });
    expect(RoomChangePageSchema.parse({ changes: [CHANGE], next: 'c1' })).toMatchObject({ next: 'c1', reset: false });
    expect(() => RoomChangeSchema.parse({ ...CHANGE, op: 'moved' })).toThrow();
  });

  it('builds a room’s path with its parts escaped', () => {
    expect(roomPath({ type: 'user_team', id: 'a/b' })).toBe('/v1/room/user_team/a%2Fb');
  });
});
