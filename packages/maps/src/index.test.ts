// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/maps', () => {
  it('publishes meeting in the middle, its reads and writes, the model, and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'MAPS_ENDPOINT',
        'MEET_PATH',
        'MODES',
        'MeetInTheMiddle',
        'MidpointSchema',
        'PlaceSchema',
        'distanceLabel',
        'durationLabel',
        'findMidpoint',
        'mapLink',
        'mapsExtension',
        'usePlaceCategories',
      ].sort(),
    );
  });
});
