'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * An on/off switch. Off is an outlined track with a smaller knob in the muted foreground, so both the
 * control's edge and its state stand out from the page by at least 3:1 in every theme (WCAG 1.4.11);
 * on is the primary track with a background-coloured knob. A filled `--input` track was 1.3:1 in dark.
 */
const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:border-muted-foreground data-[state=unchecked]:bg-transparent',
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-background data-[state=unchecked]:translate-x-0 data-[state=unchecked]:scale-75 data-[state=unchecked]:bg-muted-foreground',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
