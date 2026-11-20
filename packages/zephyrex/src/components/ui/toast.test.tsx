// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as mod from './toast';
import { Toast, ToastClose, ToastProvider, ToastTitle, ToastViewport } from './toast';

const notice = (close: React.ReactNode): React.ReactElement => (
  <ToastProvider>
    <Toast open>
      <ToastTitle>Saved</ToastTitle>
      {close}
    </Toast>
    <ToastViewport />
  </ToastProvider>
);

describe('toast', () => {
  it('module exports', () => {
    expect(mod).toBeDefined();
  });

  it('names its icon-only close button, and lets a caller rename it', () => {
    const view = render(notice(<ToastClose />));
    const close = view.getByRole('button', { name: 'Dismiss notice' });
    expect(close.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    view.rerender(notice(<ToastClose aria-label='Close' />));
    expect(view.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
