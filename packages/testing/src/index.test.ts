// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as testing from './index';

describe('@zephyrex/testing', () => {
  it('exports the accessibility pass and its theme helper', () => {
    expect(Object.keys(testing).sort()).toEqual(['WCAG_TAGS', 'violations', 'withTheme']);
  });
});
