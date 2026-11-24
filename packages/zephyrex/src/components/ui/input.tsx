// SPDX-License-Identifier: AGPL-3.0-or-later
import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

// The input is display:flex, which makes Chromium draw a date or time field's picker icon right after
// the value; as a block the icon sits at the field's end. Checked in Chromium on 2026-11-24 (margin or
// flex-grow on the icon's pseudo-elements did not move it). Text and file inputs keep flex.
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-(--control-h) w-full rounded-md border border-input bg-background px-3 py-(--control-py) text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&[type=date]]:block [&[type=datetime-local]]:block [&[type=month]]:block [&[type=time]]:block [&[type=week]]:block [&::-webkit-calendar-picker-indicator]:cursor-pointer',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
