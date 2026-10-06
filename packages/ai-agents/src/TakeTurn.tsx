// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import { takeTurn, type Turn, useTurns } from './triggersApi';
import { turnSummary } from './turnDisplay';

const PAYLOAD_ROWS = 3;

/** Run a turn of the agent now, with instructions if wanted, and see how it ended. */
export function TakeTurn({ agentId }: { agentId: string }): ReactElement {
  const client = useClient();
  const id = useId();
  const { mutate: refreshTurns } = useTurns(agentId);
  const [payload, setPayload] = useState('');
  const [pending, setPending] = useState(false);
  const [ended, setEnded] = useState<Turn | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPending(true);
    setEnded(null);
    const running = (async (): Promise<void> => {
      setEnded(await takeTurn(client, agentId, payload.trim() === '' ? null : payload.trim()));
      await refreshTurns();
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(running, 'The turn could not be run.'));
      setPending(false);
    })();
  };

  return (
    <div className='grid gap-3'>
      <form aria-label='Run a turn' className='grid gap-2' noValidate onSubmit={submit}>
        <Label htmlFor={id}>Instructions (optional)</Label>
        <Textarea id={id} rows={PAYLOAD_ROWS} value={payload} onChange={(event) => setPayload(event.target.value)} />
        <div>
          <Button type='submit' disabled={pending}>
            {pending ? 'Running…' : 'Run a turn now'}
          </Button>
        </div>
      </form>
      {ended !== null && (
        <p role='status' className={ended.status === 'failed' ? 'text-sm text-destructive' : 'text-sm'}>
          {turnSummary(ended)}
        </p>
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
