// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { chainsFixture } from './chains.mocks';
import {
  argumentLines,
  draftOfStep,
  NEW_STEP,
  nextPosition,
  parseArguments,
  parseInputs,
  stepChanges,
  stepFields,
  stepProblem,
} from './stepModel';

const prompt = { ...NEW_STEP, name: 'ask', promptId: 'brief' };

describe('parseArguments and argumentLines', () => {
  it('reads one name = expression per line, skipping blank lines', () => {
    expect(parseArguments('TEXT = found\n\n  limit=3 ')).toEqual({ arguments: { TEXT: 'found', limit: '3' } });
    expect(argumentLines({ TEXT: 'found', limit: '3' })).toBe('TEXT = found\nlimit = 3');
    expect(argumentLines(null)).toBe('');
  });

  it('says which line is not an argument', () => {
    expect(parseArguments('found')).toEqual({ problem: 'Write each argument as name = expression, not “found”.' });
    expect(parseArguments('2x = 1')).toEqual({ problem: 'Write each argument as name = expression, not “2x = 1”.' });
    expect(parseArguments('x =')).toEqual({ problem: 'Write each argument as name = expression, not “x =”.' });
  });
});

describe('stepProblem', () => {
  it('wants a name that is an identifier other than end', () => {
    expect(stepProblem({ ...prompt, name: '' })).toMatch(/A step’s name is a letter/);
    expect(stepProblem({ ...prompt, name: 'end' })).toMatch(/not “end”/);
    expect(stepProblem(prompt)).toBeNull();
  });

  it('wants what each kind needs', () => {
    expect(stepProblem({ ...prompt, promptId: '' })).toBe('A prompt step names its prompt.');
    expect(stepProblem({ ...prompt, kind: 'ability' })).toBe('An ability step names its ability.');
    expect(stepProblem({ ...prompt, kind: 'condition' })).toBe('A condition step needs an expression.');
    expect(stepProblem({ ...prompt, kind: 'set', expression: '1' })).toBe('A set step names the variable it sets.');
    expect(stepProblem({ ...prompt, variable: '1x' })).toBe('The variable is a letter, then letters, digits or _.');
  });

  it('checks a condition’s jumps and loops, the position, and the arguments', () => {
    const condition = { ...prompt, kind: 'condition' as const, expression: 'x > 1' };
    expect(stepProblem({ ...condition, onTrue: 'end', onFalse: 'ask' })).toBeNull();
    expect(stepProblem({ ...condition, onFalse: 'no where' })).toMatch(/not “no where”/);
    expect(stepProblem({ ...condition, maxLoops: '0' })).toMatch(/from 1 to 1000/);
    expect(stepProblem({ ...prompt, position: '-1' })).toBe('The position is a whole number from 0.');
    expect(stepProblem({ ...prompt, arguments: 'nonsense' })).toMatch(/name = expression/);
  });
});

describe('stepFields', () => {
  it('sends only the fields the step’s kind uses', () => {
    const fields = stepFields({
      ...prompt,
      arguments: 'TEXT = found',
      variable: ' out ',
      expression: 'ignored',
      onTrue: 'x',
      position: '2',
    });
    expect(fields).toEqual({
      name: 'ask',
      position: 2,
      kind: 'prompt',
      prompt_id: 'brief',
      ability_id: null,
      arguments: { TEXT: 'found' },
      expression: null,
      variable: 'out',
      on_true: null,
      on_false: null,
      max_loops: null,
    });
    expect(
      stepFields({ ...prompt, kind: 'condition', expression: ' x ', onFalse: 'end', maxLoops: '3', variable: 'ignored' }),
    ).toMatchObject({ prompt_id: null, arguments: null, expression: 'x', variable: null, on_false: 'end', max_loops: 3 });
  });
});

describe('draftOfStep and stepChanges', () => {
  const { steps } = chainsFixture();

  it('round-trips a step through its form with nothing changed', () => {
    for (const step of steps) {
      expect(stepChanges(step, draftOfStep(step))).toEqual({});
    }
  });

  it('keeps only what changed', () => {
    const check = rowOf(steps, 's-check');
    expect(stepChanges(check, { ...draftOfStep(check), onTrue: 'search', maxLoops: '' })).toEqual({
      on_true: 'search',
      max_loops: null,
    });
    const search = rowOf(steps, 's-search');
    expect(stepChanges(search, { ...draftOfStep(search), arguments: 'query = topic\nlimit = 3' })).toEqual({
      arguments: { query: 'topic', limit: '3' },
    });
  });
});

describe('nextPosition', () => {
  it('puts a new step after the last, or first in an empty chain', () => {
    expect(nextPosition(chainsFixture().steps)).toBe(4);
    expect(nextPosition([])).toBe(0);
  });
});

describe('parseInputs', () => {
  it('reads a JSON object of variables, none for blank', () => {
    expect(parseInputs(' ')).toEqual({ inputs: {} });
    expect(parseInputs('{"topic": "engines", "limit": 3}')).toEqual({ inputs: { topic: 'engines', limit: 3 } });
  });

  it('wants an object whose names are identifiers', () => {
    const notAnObject = { problem: 'The inputs are a JSON object, such as {"topic": "engines"}.' };
    expect(parseInputs('{')).toEqual(notAnObject);
    expect(parseInputs('[1]')).toEqual(notAnObject);
    expect(parseInputs('{"2x": 1}')).toEqual({
      problem: 'An input’s name is a letter, then letters, digits or _, not “2x”.',
    });
  });
});
