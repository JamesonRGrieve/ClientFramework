// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId } from 'react';
import { useRotations } from './agentsApi';

const DEFAULT = '';

/** Choose the rotation of model instances an agent thinks with, or none (the default). */
export function RotationPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (rotationId: string | null) => void;
}): ReactElement {
  const id = useId();
  const { data: rotations = [] } = useRotations();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>Thinks with</Label>
      <select
        id={id}
        className='rounded-md border bg-background px-2 py-2 text-sm'
        value={value ?? DEFAULT}
        onChange={(event) => onChange(event.target.value === DEFAULT ? null : event.target.value)}
      >
        <option value={DEFAULT}>The default models</option>
        {rotations.map((rotation) => (
          <option key={rotation.id} value={rotation.id}>
            {rotation.name}
          </option>
        ))}
      </select>
    </div>
  );
}
