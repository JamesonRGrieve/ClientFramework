// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useId, useState } from 'react';
import type { Versioned } from '../client';
import type { Conflict } from '../useGuardedSave';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/** A field of the user's changes to set beside the row as it is now. */
export interface ConflictField<T> {
  readonly key: keyof T & string;
  readonly label: string;
  /**
   * One side's value as the user knows it (a role's name for its id), from that side's row; the
   * field's `displayValue` when omitted.
   */
  readonly format?: (row: Partial<T>) => string;
}

type Side = 'mine' | 'theirs';

interface ConflictPanelProps<T> {
  conflict: Conflict<T>;
  /** The fields the user changed that the panel compares; none for a change such as a revoke. */
  fields: readonly ConflictField<T>[];
  /** Writes the merged changes over the row as it is now. */
  onResolve: (merged: Partial<T>) => void;
  /** Drops the user's changes. */
  onDiscard: () => void;
  /** The resolving button's label, for a change with no fields to compare: "Revoke anyway". */
  applyLabel?: string | undefined;
}

const EMPTY = '(empty)';

/** A field's value as text: strings as written, anything else as JSON. */
export function displayValue<V>(value: V): string {
  if (value === undefined || value === null || value === '') {
    return EMPTY;
  }
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Shown where a write was refused because someone changed the row first. Each changed field sits
 * beside its current value, and the user keeps theirs or takes the current one; nothing they typed
 * is dropped unless they choose to discard it.
 */
export function ConflictPanel<T extends Versioned>({
  conflict,
  fields,
  onResolve,
  onDiscard,
  applyLabel,
}: ConflictPanelProps<T>) {
  const id = useId();
  const [sides, setSides] = useState<ReadonlyMap<keyof T & string, Side>>(new Map());
  const { mine, theirs } = conflict;
  const compared = fields.filter(({ key }) => key in mine);

  const merge = (current: T): Partial<T> => {
    const merged: Partial<T> = { ...mine };
    for (const { key } of compared) {
      if (sides.get(key) === 'theirs') {
        merged[key] = current[key];
      }
    }
    return merged;
  };

  return (
    <Alert>
      <AlertTitle>Someone changed this after you opened it</AlertTitle>
      <AlertDescription className='space-y-3'>
        {theirs === null ? (
          <p>It may have been removed. Discard your changes and reload to see it as it is now.</p>
        ) : (
          <>
            <p>
              {compared.length === 0
                ? 'Check it as it is now before going ahead.'
                : 'For each field, keep your value or take the current one.'}
            </p>
            {compared.map(({ key, label, format = (row: Partial<T>): string => displayValue(row[key]) }) => (
              <fieldset key={key} className='space-y-1'>
                <legend className='font-medium'>{label}</legend>
                <RadioGroup
                  value={sides.get(key) ?? 'mine'}
                  onValueChange={(side) => {
                    setSides(new Map(sides).set(key, side === 'theirs' ? 'theirs' : 'mine'));
                  }}
                >
                  <div className='flex items-center gap-2'>
                    <RadioGroupItem value='mine' id={`${id}-${key}-mine`} />
                    <Label htmlFor={`${id}-${key}-mine`}>Yours: {format(mine)}</Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <RadioGroupItem value='theirs' id={`${id}-${key}-theirs`} />
                    <Label htmlFor={`${id}-${key}-theirs`}>Current: {format(theirs)}</Label>
                  </div>
                </RadioGroup>
              </fieldset>
            ))}
          </>
        )}
        <div className='flex flex-wrap gap-2'>
          {theirs !== null && (
            <Button
              type='button'
              onClick={() => {
                onResolve(merge(theirs));
              }}
            >
              {compared.length === 0 ? (applyLabel ?? 'Go ahead anyway') : 'Save merged'}
            </Button>
          )}
          <Button type='button' variant='outline' onClick={onDiscard}>
            Discard my changes
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
