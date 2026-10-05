// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { promptsFixture, SUMMARY_ID } from './prompts.mocks';
import { renderPrompts } from './testing.mocks';
import { givenValues, TryPrompt } from './TryPrompt';

describe('givenValues', () => {
  it('leaves out the blank values, so the server uses the defaults for them', () => {
    expect(givenValues({ A: 'x', B: '' })).toEqual({ A: 'x' });
  });
});

describe('TryPrompt', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds the prompt from the values given and the defaults, and says what is still missing', async () => {
    const user = userEvent.setup();
    const view = renderPrompts(<TryPrompt prompt={rowOf(promptsFixture().prompts, SUMMARY_ID)} />);
    await user.type(view.getByLabelText('TOPIC'), 'rust');
    await user.click(view.getByRole('button', { name: 'Build' }));
    const built = await view.findByRole('region', { name: 'Built prompt' });
    expect(built).toHaveTextContent('Summarise rust for engineers in {LENGTH} words.');
    expect(built).toHaveTextContent('Still missing: LENGTH');
  });
});
