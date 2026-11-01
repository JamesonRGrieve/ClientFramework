'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';

/** What the user types to confirm, so a slip of the mouse never deletes an account. */
const CONFIRMATION = 'delete';

const GENERAL_NOTE = 'Your account and what this app keeps about you are erased. This cannot be undone.';

/**
 * Delete the signed-in user's account: confirmed by typing "delete", then `onDelete`, which erases
 * the account (the server erases what its extensions hold first). `note` says what goes.
 */
export function DeleteAccount({
  onDelete,
  note = GENERAL_NOTE,
}: {
  onDelete: () => Promise<void>;
  note?: string | undefined;
}): ReactElement {
  const confirmId = useId();
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (typed.trim().toLowerCase() !== CONFIRMATION) {
      return;
    }
    setPending(true);
    setProblem(null);
    void (async (): Promise<void> => {
      try {
        await onDelete();
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'Your account could not be deleted.');
        setPending(false);
      }
    })();
  };

  return (
    <Card className='border-destructive/40'>
      <CardHeader>
        <CardTitle>Delete your account</CardTitle>
        <CardDescription>{note}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className='flex flex-wrap items-end gap-3'>
          <div className='grid gap-1'>
            <Label htmlFor={confirmId}>Type “{CONFIRMATION}” to confirm</Label>
            <Input
              id={confirmId}
              value={typed}
              autoComplete='off'
              onChange={(event) => setTyped(event.target.value)}
              className='w-48'
            />
          </div>
          <Button type='submit' variant='destructive' disabled={pending || typed.trim().toLowerCase() !== CONFIRMATION}>
            {pending ? 'Deleting…' : 'Delete my account'}
          </Button>
        </form>
        {problem !== null && (
          <p role='alert' className='mt-3 text-sm text-destructive'>
            {problem}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
