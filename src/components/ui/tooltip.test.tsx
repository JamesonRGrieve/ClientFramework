// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('tooltip', () => {
  it('module exports', async () => {
    const mod = await import('./tooltip');
    expect(mod).toBeDefined();
  });
});
