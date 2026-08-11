// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('slider', () => {
  it('module exports', async () => {
    const mod = await import('./slider');
    expect(mod).toBeDefined();
  });
});
