// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's rooms extension: live changes to a record for everyone who may see it.
export { roomsExtension } from './extension';
export {
  MAX_CHANGES_PAGE,
  RecordRefSchema,
  ROOM_ENDPOINT,
  RoomChangePageSchema,
  RoomChangeSchema,
  roomPath,
} from './roomsModel';
export type { RoomChange, RoomChangePage, RoomRef } from './roomsModel';
export { POLL_INTERVAL_MS, useRoom } from './useRoom';
export type { RoomOptions, RoomStatus } from './useRoom';
