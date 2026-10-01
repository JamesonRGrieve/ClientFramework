// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/observability', () => {
  it('publishes the status view and the hook it reads', () => {
    expect(Object.keys(published).sort()).toEqual(
      ['OBSERVABILITY_STATUS_PATH', 'ObservabilityStatus', 'useObservabilityStatus'].sort(),
    );
    expect(published.OBSERVABILITY_STATUS_PATH).toBe('/v1/observability/status');
  });
});
