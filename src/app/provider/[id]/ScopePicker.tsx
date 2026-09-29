'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { JSX } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Radix Select can't hold `null`; this value stands for "no narrowing". */
const ANY = '__any__';

export interface ScopeOption {
  value: string;
  label: string;
}

/**
 * A labelled picker for one level of the provider scope. With `anyLabel`, the first option
 * clears the choice (`onChange(null)`); without it, a choice is required.
 */
export function ScopePicker({
  id,
  label,
  value,
  options,
  onChange,
  anyLabel,
  placeholder,
}: {
  id: string;
  label: string;
  value: string | null;
  options: readonly ScopeOption[];
  onChange: (value: string | null) => void;
  anyLabel?: string;
  placeholder?: string;
}): JSX.Element {
  const selected = value ?? (anyLabel === undefined ? '' : ANY);
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={selected}
        disabled={options.length === 0}
        onValueChange={(next) => {
          onChange(next === ANY ? null : next);
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue {...(placeholder === undefined ? {} : { placeholder })} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {anyLabel !== undefined && <SelectItem value={ANY}>{anyLabel}</SelectItem>}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
