'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useToast } from '@/hooks/useToast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    // Named "Notices", not Radix's default "Notifications": an app's notifications page is another thing,
    // and tests and screen readers must be able to tell the two apart.
    <ToastProvider label='Notice'>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className='grid gap-1'>
            {title !== undefined && <ToastTitle>{title}</ToastTitle>}
            {description !== undefined && description !== null && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport label='Notices ({hotkey})' />
    </ToastProvider>
  );
}
