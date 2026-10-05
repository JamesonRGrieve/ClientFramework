// SPDX-License-Identifier: AGPL-3.0-or-later
// A prompt's variables as the server reads them: {VARIABLE_NAME}, capitals, digits and underscores.

/** The server's longest prompt. */
export const MAX_PROMPT_CHARACTERS = 200_000;

/** A {VARIABLE_NAME} in a prompt; the name is its first group. */
export const VARIABLE = /{([A-Z_][A-Z\d_]*)}/g;
const VARIABLE_NAME = /^[A-Z_][A-Z\d_]*$/;

/** The variable names `content` uses, each once, in order of first use. */
export const variablesIn = (content: string): string[] => [
  ...new Set([...content.matchAll(VARIABLE)].map((match) => match.at(1) ?? '')),
];

/** Why `name` can't name an argument (it must be a variable name), or null. */
export const argumentNameProblem = (name: string): string | null =>
  VARIABLE_NAME.test(name) ? null : 'An argument is named like a variable: capitals, digits and _, e.g. TOPIC.';

/** The variables `content` uses that no argument names: each needs one to be given a default. */
export const variablesWithoutArguments = (content: string, argumentNames: readonly string[]): string[] =>
  variablesIn(content).filter((name) => !argumentNames.includes(name));
