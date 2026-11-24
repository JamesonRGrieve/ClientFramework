// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DensityPicker } from './DensityPicker';

const COMFORTABLE = /^Comfortable/;
const COMPACT = /^Compact/;

describe('DensityPicker', () => {
  beforeEach(() => {
    document.cookie = 'density=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    delete document.documentElement.dataset.density;
  });

  it('offers comfortable and compact as a named radio group, comfortable checked by default', () => {
    render(<DensityPicker />);
    expect(screen.getByRole('group', { name: 'Density' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: COMFORTABLE })).toBeChecked();
    expect(screen.getByRole('radio', { name: COMPACT })).not.toBeChecked();
  });

  it('marks the server’s read of the cookie, and switches the whole app on a choice', () => {
    render(<DensityPicker initialDensity='compact' />);
    expect(screen.getByRole('radio', { name: COMPACT })).toBeChecked();
    expect(document.documentElement.dataset.density).toBe('compact');
    fireEvent.click(screen.getByRole('radio', { name: COMFORTABLE }));
    expect(screen.getByRole('radio', { name: COMFORTABLE })).toBeChecked();
    expect(document.documentElement.dataset.density).toBeUndefined();
  });
});
