// SPDX-License-Identifier: AGPL-3.0-or-later
// A step's form and a run's inputs: checked as the server checks them before anything is sent, and
// turned into the fields the server takes (and a step back again for editing).
import { z } from 'zod';
import { type ChainStep, type Inputs, MAX_LOOPS, type StepFields, type StepKind } from './chainsApi';

/** A step's, variable's or argument's name: a letter, then up to 63 letters, digits or underscores. */
const IDENTIFIER = /^[A-Za-z]\w{0,63}$/;
/** What a condition jumps to to stop the run. */
export const END = 'end';
const ASSIGNMENT = '=';

/** A step's form, as typed. */
export interface StepDraft {
  name: string;
  kind: StepKind;
  promptId: string;
  abilityId: string;
  /** One `name = expression` per line: a prompt's {VARIABLE}s, or an ability's arguments. */
  arguments: string;
  expression: string;
  variable: string;
  onTrue: string;
  onFalse: string;
  maxLoops: string;
  position: string;
}

export const NEW_STEP: StepDraft = {
  name: '',
  kind: 'prompt',
  promptId: '',
  abilityId: '',
  arguments: '',
  expression: '',
  variable: '',
  onTrue: '',
  onFalse: '',
  maxLoops: '',
  position: '0',
};

const isIdentifier = (name: string): boolean => IDENTIFIER.test(name);

/** A step's arguments from their lines, or why they can't be read. */
export function parseArguments(text: string): { arguments: Record<string, string> } | { problem: string } {
  const parsed: Record<string, string> = {};
  for (const line of text.split('\n').filter((row) => row.trim() !== '')) {
    const at = line.indexOf(ASSIGNMENT);
    const name = line.slice(0, Math.max(at, 0)).trim();
    const expression = line.slice(at + 1).trim();
    if (at < 0 || !isIdentifier(name) || expression === '') {
      return { problem: `Write each argument as name = expression, not “${line.trim()}”.` };
    }
    parsed[name] = expression;
  }
  return { arguments: parsed };
}

/** Lines of `name = expression`, as the form shows a step's arguments. */
export const argumentLines = (args: Readonly<Record<string, string>> | null | undefined): string =>
  Object.entries(args ?? {})
    .map(([name, expression]) => `${name} ${ASSIGNMENT} ${expression}`)
    .join('\n');

/** Whether `text` is a whole number from `least` to `most`. */
const isWholeBetween = (text: string, least: number, most: number): boolean => {
  const value = Number(text);
  return Number.isInteger(value) && value >= least && value <= most;
};

/** What `draft`'s kind needs that it lacks: its prompt, its ability, or an expression. */
function kindProblem({ kind, promptId, abilityId, expression }: StepDraft): string | null {
  if (kind === 'prompt' && promptId === '') {
    return 'A prompt step names its prompt.';
  }
  if (kind === 'ability' && abilityId === '') {
    return 'An ability step names its ability.';
  }
  return (kind === 'condition' || kind === 'set') && expression.trim() === '' ? `A ${kind} step needs an expression.` : null;
}

/** What is wrong with the variable a step sets or puts its output in, or null. */
function variableProblem({ kind, variable }: StepDraft): string | null {
  const name = variable.trim();
  if ((kind !== 'set' && name === '') || (isIdentifier(name) && name !== END)) {
    return null;
  }
  return kind === 'set' ? 'A set step names the variable it sets.' : 'The variable is a letter, then letters, digits or _.';
}

/** What is wrong with a condition's jumps or its bound on looping, or null. */
function conditionProblem({ onTrue, onFalse, maxLoops }: StepDraft): string | null {
  const target = [onTrue, onFalse].map((jump) => jump.trim()).find((jump) => jump !== '' && !isIdentifier(jump));
  if (target !== undefined) {
    return `A condition jumps to a step’s name or “${END}”, not “${target}”.`;
  }
  const loops = maxLoops.trim();
  return loops === '' || isWholeBetween(loops, 1, MAX_LOOPS)
    ? null
    : `The most loops is a whole number from 1 to ${String(MAX_LOOPS)}.`;
}

/** Why the server would refuse `draft`, or null. */
export function stepProblem(draft: StepDraft): string | null {
  const name = draft.name.trim();
  if (!isIdentifier(name) || name === END) {
    return `A step’s name is a letter, then letters, digits or _ (and not “${END}”).`;
  }
  const problem =
    kindProblem(draft) ?? variableProblem(draft) ?? (draft.kind === 'condition' ? conditionProblem(draft) : null);
  if (problem !== null) {
    return problem;
  }
  if (!isWholeBetween(draft.position, 0, Number.MAX_SAFE_INTEGER)) {
    return 'The position is a whole number from 0.';
  }
  const parsed = parseArguments(draft.arguments);
  return 'problem' in parsed ? parsed.problem : null;
}

const orNull = (text: string): string | null => (text.trim() === '' ? null : text.trim());

/** The fields the server takes for `draft`, each only for the kinds that use it; call only once `stepProblem` is null. */
export function stepFields(draft: StepDraft): StepFields {
  const { kind } = draft;
  const parsed = parseArguments(draft.arguments);
  const takesArguments = kind === 'prompt' || kind === 'ability';
  const isCondition = kind === 'condition';
  return {
    name: draft.name.trim(),
    position: Number(draft.position),
    kind,
    prompt_id: kind === 'prompt' ? draft.promptId : null,
    ability_id: kind === 'ability' ? draft.abilityId : null,
    arguments: takesArguments && 'arguments' in parsed && Object.keys(parsed.arguments).length > 0 ? parsed.arguments : null,
    expression: isCondition || kind === 'set' ? draft.expression.trim() : null,
    variable: isCondition ? null : orNull(draft.variable),
    on_true: isCondition ? orNull(draft.onTrue) : null,
    on_false: isCondition ? orNull(draft.onFalse) : null,
    max_loops: isCondition && draft.maxLoops.trim() !== '' ? Number(draft.maxLoops) : null,
  };
}

/** A step as its form shows it, for editing. */
export const draftOfStep = (step: ChainStep): StepDraft => ({
  name: step.name,
  kind: step.kind,
  promptId: step.prompt_id ?? '',
  abilityId: step.ability_id ?? '',
  arguments: argumentLines(step.arguments),
  expression: step.expression ?? '',
  variable: step.variable ?? '',
  onTrue: step.on_true ?? '',
  onFalse: step.on_false ?? '',
  maxLoops: step.max_loops === null || step.max_loops === undefined ? '' : String(step.max_loops),
  position: String(step.position),
});

/** Only what the user changed in `draft` over `step`, so a save never rewrites what someone else changed. */
export function stepChanges(step: ChainStep, draft: StepDraft): Partial<ChainStep> {
  const fields = stepFields(draft);
  const differs = <K extends keyof StepFields>(key: K): boolean => fields[key] !== (step[key] ?? null);
  return {
    ...(differs('name') ? { name: fields.name } : {}),
    ...(differs('position') ? { position: fields.position } : {}),
    ...(differs('kind') ? { kind: fields.kind } : {}),
    ...(differs('prompt_id') ? { prompt_id: fields.prompt_id } : {}),
    ...(differs('ability_id') ? { ability_id: fields.ability_id } : {}),
    ...(argumentLines(fields.arguments) === argumentLines(step.arguments) ? {} : { arguments: fields.arguments }),
    ...(differs('expression') ? { expression: fields.expression } : {}),
    ...(differs('variable') ? { variable: fields.variable } : {}),
    ...(differs('on_true') ? { on_true: fields.on_true } : {}),
    ...(differs('on_false') ? { on_false: fields.on_false } : {}),
    ...(differs('max_loops') ? { max_loops: fields.max_loops } : {}),
  };
}

const InputsSchema = z.record(z.string(), z.json());
const JsonSchema = z.json();

/** `text` as JSON, or undefined when it isn't. */
function jsonOf(text: string): z.infer<typeof JsonSchema> | undefined {
  try {
    return JsonSchema.parse(JSON.parse(text));
  } catch {
    return undefined;
  }
}
const NOT_AN_OBJECT = 'The inputs are a JSON object, such as {"topic": "engines"}.';

/** A run's starting variables from their JSON object text (blank for none), or why they can't be read. */
export function parseInputs(text: string): { inputs: Inputs } | { problem: string } {
  if (text.trim() === '') {
    return { inputs: {} };
  }
  const parsed = InputsSchema.safeParse(jsonOf(text));
  if (!parsed.success) {
    return { problem: NOT_AN_OBJECT };
  }
  const misnamed = Object.keys(parsed.data).find((name) => !isIdentifier(name));
  return misnamed === undefined
    ? { inputs: parsed.data }
    : { problem: `An input’s name is a letter, then letters, digits or _, not “${misnamed}”.` };
}

/** Where a new step goes: after the chain's last. */
export const nextPosition = (steps: readonly Pick<ChainStep, 'position'>[]): number =>
  steps.reduce((last, { position }) => Math.max(last, position + 1), 0);
