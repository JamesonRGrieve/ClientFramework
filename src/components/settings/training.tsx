'use client';

import type { JSX } from 'react';

export interface TrainingProps {
  /** Whether to show the user-scoped training view (vs. the admin view). */
  isUser: boolean;
}

/**
 * Training settings panel.
 *
 * Agent-scoped training data is not wired up in this template; downstream apps
 * inject it via their own `@/interface/Settings/training` override. The template
 * ships a typed placeholder so the settings dialog compiles standalone.
 */
export default function Training({ isUser }: TrainingProps): JSX.Element {
  return (
    <div className='text-sm text-muted-foreground'>
      {isUser
        ? 'User training settings are configured by the downstream application.'
        : 'Admin training settings are configured by the downstream application.'}
    </div>
  );
}
