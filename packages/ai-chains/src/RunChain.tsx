// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import { type ChainRun, runChain, useChainRuns } from './chainsApi';
import { runSummary } from './runDisplay';
import { parseInputs } from './stepModel';

const INPUT_ROWS = 3;

/** Run the chain now with its starting variables, and see how it ended and what it produced. */
export function RunChain({ chainId }: { chainId: string }): ReactElement {
  const client = useClient();
  const id = useId();
  const { mutate: refreshRuns } = useChainRuns(chainId);
  const [inputs, setInputs] = useState('');
  const [pending, setPending] = useState(false);
  const [ended, setEnded] = useState<ChainRun | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const parsed = parseInputs(inputs);
    if ('problem' in parsed) {
      setProblem(parsed.problem);
      return;
    }
    setPending(true);
    setEnded(null);
    const running = (async (): Promise<void> => {
      setEnded(await runChain(client, chainId, parsed.inputs));
      await refreshRuns();
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(running, 'The chain could not be run.'));
      setPending(false);
    })();
  };

  return (
    <div className='grid gap-3'>
      <form aria-label='Run the chain' className='grid gap-2' noValidate onSubmit={submit}>
        <Label htmlFor={id}>Inputs (optional)</Label>
        <Textarea
          id={id}
          rows={INPUT_ROWS}
          className='font-mono'
          placeholder='{"topic": "engines"}'
          value={inputs}
          onChange={(event) => {
            setInputs(event.target.value);
            setProblem(null);
          }}
        />
        <div>
          <Button type='submit' disabled={pending}>
            {pending ? 'Running…' : 'Run it now'}
          </Button>
        </div>
      </form>
      {ended !== null && (
        <div role='status' className='grid gap-1 text-sm'>
          <p className={ended.status === 'failed' ? 'text-destructive' : ''}>{runSummary(ended)}</p>
          {(ended.output ?? '') !== '' && (
            <pre className='whitespace-pre-wrap rounded bg-muted p-2 text-xs'>{ended.output}</pre>
          )}
        </div>
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
