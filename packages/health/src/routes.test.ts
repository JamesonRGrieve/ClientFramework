// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { HEALTH_PATH, recordsPath } from './routes';

describe('health routes', () => {
  it('puts each log under the health page', () => {
    expect(HEALTH_PATH).toBe('/health');
    expect(recordsPath('sleep')).toBe('/health/sleep');
    expect(recordsPath('a b')).toBe('/health/a%20b');
  });
});
