// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { type ReactElement, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepFieldset } from './StepFieldset';
import { NEW_STEP, type StepDraft } from './stepModel';
import { renderChains } from './testing.mocks';

const KIND = 'What it does';

/** The fieldset over its own draft, reporting each change. */
function Editable({ onChange }: { onChange: (draft: StepDraft) => void }): ReactElement {
  const [draft, setDraft] = useState(NEW_STEP);
  return (
    <StepFieldset
      draft={draft}
      onChange={(changed) => {
        setDraft(changed);
        onChange(changed);
      }}
    />
  );
}

describe('StepFieldset', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks a prompt step for its prompt, its variables and where its output goes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = renderChains(<Editable onChange={onChange} />);
    await user.selectOptions(view.getByLabelText('Prompt'), await view.findByRole('option', { name: 'Brief' }));
    await user.type(view.getByLabelText('Fill its variables (optional)'), 'TEXT = found');
    await user.type(view.getByLabelText('Output into (optional)'), 'summary');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'prompt', promptId: 'brief', arguments: 'TEXT = found', variable: 'summary' }),
    );
    expect(view.queryByLabelText('Test')).not.toBeInTheDocument();
  });

  it('asks an ability step for its ability by name', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = renderChains(<Editable onChange={onChange} />);
    await user.selectOptions(view.getByLabelText(KIND), 'Use an ability');
    await user.selectOptions(view.getByLabelText('Ability'), await view.findByRole('option', { name: 'Search the web' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'ability', abilityId: 'ab-search' }));
    expect(view.getByLabelText('Arguments (optional)')).toBeInTheDocument();
  });

  it('asks a condition for its test and jumps, and a set step for its value and variable', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = renderChains(<Editable onChange={onChange} />);
    await user.selectOptions(view.getByLabelText(KIND), 'Check a condition');
    await user.type(view.getByLabelText('Test'), 'x > 1');
    await user.type(view.getByLabelText('When false, go to (optional)'), 'end');
    await user.type(view.getByLabelText('Most times it jumps back (optional)'), '3');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ expression: 'x > 1', onFalse: 'end', maxLoops: '3' }),
    );
    expect(view.queryByLabelText('Output into (optional)')).not.toBeInTheDocument();
    await user.selectOptions(view.getByLabelText(KIND), 'Set a variable');
    await user.type(view.getByLabelText('Variable'), 'done');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'set', expression: 'x > 1', variable: 'done' }),
    );
  });
});
