// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { cancelRun, type ChainRun, useChainRuns, useStepResults } from './chainsApi';
import { isStoppable, resultSummary, runSummary } from './runDisplay';

/** How many of the newest runs are listed. */
const SHOWN_RUNS = 20;

/** The steps a run executed, in order, each with what it was given and produced. */
function StepResults({ runId }: { runId: string }): ReactElement {
  const { data: results = [], error, isLoading } = useStepResults(runId);
  if (error !== undefined) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        Its steps could not be loaded: {error.message}
      </p>
    );
  }
  if (results.length === 0) {
    return <p className='text-xs text-muted-foreground'>{isLoading ? 'Loading…' : 'It ran no steps.'}</p>;
  }
  return (
    <ol aria-label='Its steps' className='grid gap-2 text-xs'>
      {results.map((result) => (
        <li key={result.id} className='grid gap-0.5'>
          <span className={result.status === 'failed' ? 'text-destructive' : 'font-medium'}>{resultSummary(result)}</span>
          {(result.error ?? '') !== '' && <span className='text-destructive'>{result.error}</span>}
          {(result.output ?? '') !== '' && <code className='whitespace-pre-wrap break-all'>{result.output}</code>}
        </li>
      ))}
    </ol>
  );
}

/** One run: how it stands or ended, stopping it while it may still run, and the steps it executed when opened. */
function RunItem({ run }: { run: ChainRun }): ReactElement {
  const client = useClient();
  const { mutate: refreshRuns } = useChainRuns(run.chain_id);
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const stop = (): void => {
    const stopping = (async (): Promise<void> => {
      await cancelRun(client, run.id, null);
      await refreshRuns();
    })();
    void writeProblem(stopping, 'The run could not be stopped.').then(setProblem);
  };

  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className={run.status === 'failed' ? 'text-destructive' : ''}>{runSummary(run)}</span>
        <div className='flex gap-2'>
          {isStoppable(run) && (
            <Button type='button' size='sm' variant='outline' disabled={run.cancel_requested} onClick={stop}>
              {run.cancel_requested ? 'Stopping…' : 'Stop'}
            </Button>
          )}
          <Button type='button' size='sm' variant='ghost' aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Hide' : 'Its steps'}
          </Button>
        </div>
      </div>
      {run.inputs !== null && run.inputs !== undefined && Object.keys(run.inputs).length > 0 && (
        <code className='text-xs text-muted-foreground'>{JSON.stringify(run.inputs)}</code>
      )}
      {open && <StepResults runId={run.id} />}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** The chain's most recent runs, newest first. */
export function ChainRuns({ chainId }: { chainId: string }): ReactElement {
  const { data: runs = [], error, isLoading } = useChainRuns(chainId);
  return (
    <div className='grid gap-3'>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The runs could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && runs.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'It has not been run yet.'}</p>
      )}
      {runs.length > 0 && (
        <ul aria-label='Runs' className='divide-y rounded-md border'>
          {runs.slice(0, SHOWN_RUNS).map((run) => (
            <RunItem key={run.id} run={run} />
          ))}
        </ul>
      )}
    </div>
  );
}
