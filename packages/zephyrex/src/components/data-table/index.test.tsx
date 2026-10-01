// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as mod from './index';

describe('index', () => {
  it('module exports', () => {
    expect(mod).toBeDefined();
  });
});
