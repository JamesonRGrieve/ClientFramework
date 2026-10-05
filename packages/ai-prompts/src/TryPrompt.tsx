// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { variablesIn } from './promptModel';
import { type BuiltPrompt, buildPrompt, type Prompt } from './promptsApi';

/** One variable's value input. */
function VariableInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>
        <code>{name}</code>
      </Label>
      <Input id={id} value={value} placeholder='(its default)' onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

/** Values given for `names`: blanks left out, so the server uses the defaults for them. */
export const givenValues = (values: Readonly<Record<string, string>>): Record<string, string> =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));

/** Fill the prompt's variables (blank ones from their defaults) and see the text the server builds. */
export function TryPrompt({ prompt }: { prompt: Prompt }): ReactElement {
  const client = useClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [built, setBuilt] = useState<BuiltPrompt | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setProblem(null);
    const building = (async (): Promise<void> => {
      setBuilt(await buildPrompt(client, prompt.id, givenValues(values)));
    })();
    void writeProblem(building, 'The prompt could not be built.').then(setProblem);
  };

  return (
    <div className='grid gap-3'>
      <form aria-label='Try the prompt' className='grid gap-3' noValidate onSubmit={submit}>
        {variablesIn(prompt.content).map((name) => (
          <VariableInput
            key={name}
            name={name}
            value={values[name] ?? ''}
            onChange={(value) => setValues((current) => ({ ...current, [name]: value }))}
          />
        ))}
        <div>
          <Button type='submit'>Build</Button>
        </div>
      </form>
      {built !== null && (
        <section aria-label='Built prompt' className='grid gap-2'>
          <pre className='whitespace-pre-wrap rounded bg-muted p-3 text-sm'>{built.text}</pre>
          {built.missing.length > 0 && <p className='text-sm text-destructive'>Still missing: {built.missing.join(', ')}</p>}
        </section>
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
