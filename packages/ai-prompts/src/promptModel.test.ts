// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { argumentNameProblem, variablesIn, variablesWithoutArguments } from './promptModel';

describe('promptModel', () => {
  it('reads a prompt’s variables as the server does: {CAPITALS_1}, each once, in order', () => {
    expect(variablesIn('Hi {NAME}, {name} and {NAME} about {TOPIC_2} {_X}')).toEqual(['NAME', 'TOPIC_2', '_X']);
    expect(variablesIn('No variables here.')).toEqual([]);
  });

  it('names an argument only as a variable', () => {
    expect(argumentNameProblem('TOPIC')).toBeNull();
    expect(argumentNameProblem('topic')).not.toBeNull();
    expect(argumentNameProblem('1ST')).not.toBeNull();
  });

  it('finds the variables no argument names', () => {
    expect(variablesWithoutArguments('{A} {B} {C}', ['B'])).toEqual(['A', 'C']);
  });
});
