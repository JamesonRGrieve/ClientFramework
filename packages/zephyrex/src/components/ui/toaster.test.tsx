// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toaster } from './toaster';
import { notify } from '@/hooks/useToast';

describe('Toaster', () => {
  it('shows notices in a region named Notices, apart from any notifications page', () => {
    render(<Toaster />);
    act(() => {
      notify('Peonies deleted');
    });
    expect(screen.getByRole('region', { name: /^Notices/ })).toBeInTheDocument();
    expect(screen.getByText('Peonies deleted')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /^Notifications/ })).toBeNull();
  });
});
