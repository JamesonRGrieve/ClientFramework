// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/rota', () => {
  it('publishes the rota page, its reads and writes, the model, and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'MAX_CYCLE_DAYS',
        'ROTA_ENDPOINT',
        'ROTA_NIGHT_ENDPOINT',
        'ROTA_PATH',
        'RotaNightSchema',
        'RotaPage',
        'RotaSchema',
        'ScheduledNightSchema',
        'SwapSchema',
        'cycleNightLabel',
        'isoDay',
        'membersOf',
        'nightAt',
        'nightLabel',
        'rotaExtension',
        'useMyRotas',
        'useRotaActions',
        'useSchedule',
        'useSwaps',
      ].sort(),
    );
  });
});
