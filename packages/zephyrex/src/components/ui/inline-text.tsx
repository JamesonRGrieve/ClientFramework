// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type KeyboardEvent as ReactKeyboardEvent, type ReactElement, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A piece of text edited where it stands: press it (or focus it and press Enter) to type over it,
 * Enter or leaving the field saves, Escape puts it back. `onSave` returns a reason it failed, or
 * null; a failure keeps the field open with the reason under it.
 */
export function InlineText({
  value,
  label,
  onSave,
  placeholder,
  className,
  rowOpen = false,
}: {
  value: string;
  /** What the text is, for the field's name: "Gift title". */
  label: string;
  onSave: (next: string) => Promise<string | null>;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** The row's main control, where the list's row keys land (`zephyrex/hooks/rowKeys`). */
  rowOpen?: boolean;
}): ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const start = (): void => {
    setDraft(value);
    setProblem(null);
    setEditing(true);
  };
  const save = async (): Promise<void> => {
    const next = draft.trim();
    if (next === '' || next === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const failed = await onSave(next);
    setSaving(false);
    setProblem(failed);
    if (failed === null) {
      setEditing(false);
    }
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setEditing(false);
      setProblem(null);
    }
  };

  if (!editing) {
    return (
      <button
        type='button'
        onClick={start}
        data-row-open={rowOpen ? '' : undefined}
        aria-label={`${label}: ${value}. Edit`}
        className={cn(
          '-mx-1 max-w-full truncate rounded px-1 text-left decoration-dotted underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        {value === '' ? <span className='text-muted-foreground'>{placeholder ?? label}</span> : value}
      </button>
    );
  }
  return (
    <span className='grid gap-1'>
      <input
        aria-label={label}
        value={draft}
        disabled={saving}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => void save()}
        // The person just asked to edit this text, so the field takes focus as it appears.
        ref={(field) => field?.focus()}
        className={cn(
          '-mx-1 h-7 min-w-0 rounded border bg-background px-1 text-inherit outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
          className,
        )}
      />
      {problem !== null && (
        <span role='alert' className='text-xs text-destructive'>
          {problem}
        </span>
      )}
    </span>
  );
}
