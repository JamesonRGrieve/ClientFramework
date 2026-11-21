// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's rooms extension sends (server-framework extensions/rooms/BLL_Rooms.py, b6184351):
// a room is a record; each change names which record in it changed, never its data.
import { z } from 'zod';

export const ROOM_ENDPOINT = '/v1/room';
/** The most changes one polling page carries (the server's cap). */
export const MAX_CHANGES_PAGE = 500;

/** A record by the server's name for its type (`scene` for SceneModel, `user_team`) and its id. */
export const RecordRefSchema = z.object({ type: z.string(), id: z.string() });
export type RoomRef = z.infer<typeof RecordRefSchema>;

export const RoomChangeSchema = z.looseObject({
  id: z.string(),
  room: RecordRefSchema,
  record: RecordRefSchema,
  op: z.enum(['created', 'updated', 'deleted']),
  etag: z.string().nullable(),
  changed_at: z.string(),
});
/** One change: refetch `record` through its own API (or drop it on `deleted`); `etag` skips a refetch you don't need. */
export type RoomChange = z.infer<typeof RoomChangeSchema>;

export const RoomChangePageSchema = z.object({
  changes: z.array(RoomChangeSchema),
  next: z.string().nullable(),
  reset: z.boolean().default(false),
});
export type RoomChangePage = z.infer<typeof RoomChangePageSchema>;

export const ResetSchema = z.looseObject({ reason: z.string() });

/** Where a room's path starts: `/v1/room/<type>/<id>`. */
export const roomPath = (room: RoomRef): string =>
  `${ROOM_ENDPOINT}/${encodeURIComponent(room.type)}/${encodeURIComponent(room.id)}`;
