// SPDX-License-Identifier: AGPL-3.0-or-later
// How chains, steps, runs and step results read.
import { shownTime } from 'zephyrex';
import type { ChainRun, ChainStep, RunStatus, StepResult } from './chainsApi';
import { argumentLines, END } from './stepModel';

const MS_PER_SECOND = 1000;

const STATUS_LABELS: Readonly<Record<RunStatus, string>> = {
  pending: 'Waiting to run',
  running: 'Running',
  succeeded: 'Done',
  failed: 'Failed',
  cancelled: 'Stopped',
};

const ERROR_KINDS: Readonly<Record<string, string>> = {
  definition: 'its steps cannot run as written',
  limit: 'it reached a bound',
  timeout: 'it ran out of time',
  step: 'a step failed',
  cancelled: 'it was stopped',
};

/** Whether a run may still be asked to stop. */
export const isStoppable = ({ status }: Pick<ChainRun, 'status'>): boolean => status === 'pending' || status === 'running';

/** How a run stands or ended, with why it failed and how many steps it took. */
export function runSummary(run: ChainRun): string {
  const label = STATUS_LABELS[run.status];
  const steps = run.steps_executed === 1 ? '1 step' : `${String(run.steps_executed)} steps`;
  if (run.status === 'failed' || run.status === 'cancelled') {
    const why = ERROR_KINDS[run.error_kind ?? ''];
    const detail = [why, run.error].filter((part) => (part ?? '') !== '').join(': ');
    return detail === '' ? `${label} after ${steps}` : `${label} after ${steps} (${detail})`;
  }
  const at = shownTime(run.completed_at ?? run.started_at ?? run.created_at);
  return [label, run.status === 'succeeded' ? steps : '', at].filter((part) => part !== '').join(' · ');
}

/** What a step does, in words. */
export function stepSummary(
  step: ChainStep,
  names: { prompt: (id: string) => string; ability: (id: string) => string },
): string {
  const into = (step.variable ?? '') === '' ? '' : ` into ${step.variable ?? ''}`;
  const jump = (target: string | null | undefined): string =>
    (target ?? '') === '' ? 'the next step' : target === END ? 'the end' : (target ?? '');
  if (step.kind === 'prompt') {
    return `Ask ${names.prompt(step.prompt_id ?? '')}${into}`;
  }
  if (step.kind === 'ability') {
    return `Use ${names.ability(step.ability_id ?? '')}${into}`;
  }
  if (step.kind === 'set') {
    return `Set ${step.variable ?? ''} to ${step.expression ?? ''}`;
  }
  return `If ${step.expression ?? ''}, go to ${jump(step.on_true)}; otherwise ${jump(step.on_false)}`;
}

/** A step's arguments as the list shows them, empty when it has none. */
export const stepArguments = (step: Pick<ChainStep, 'arguments'>): string =>
  argumentLines(step.arguments).replaceAll('\n', '; ');

/** One executed step: its place, name, kind, how it ended and how long it took. */
export function resultSummary(result: StepResult): string {
  const took =
    result.duration_ms === null || result.duration_ms === undefined
      ? ''
      : ` in ${(result.duration_ms / MS_PER_SECOND).toFixed(1)}s`;
  return `${String(result.sequence)}. ${result.step_name} (${result.kind}) · ${result.status}${took}`;
}
