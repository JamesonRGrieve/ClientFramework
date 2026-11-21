// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/rooms', () => {
  it('publishes the hook, the model and the extension', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'MAX_CHANGES_PAGE',
        'POLL_INTERVAL_MS',
        'ROOM_ENDPOINT',
        'RecordRefSchema',
        'RoomChangePageSchema',
        'RoomChangeSchema',
        'roomPath',
        'roomsExtension',
        'useRoom',
      ].sort(),
    );
  });
});
