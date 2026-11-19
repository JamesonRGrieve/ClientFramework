// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ChoiceChip } from './choice-chip';

function Kinds(): React.JSX.Element {
  const [kind, setKind] = useState('');
  return (
    <div role='radiogroup' aria-label='Kind'>
      {['Rule', 'Wish'].map((choice) => (
        <ChoiceChip key={choice} checked={kind === choice} onClick={() => setKind(kind === choice ? '' : choice)}>
          {choice}
        </ChoiceChip>
      ))}
    </div>
  );
}

describe('ChoiceChip', () => {
  it('reads as a radio in its group, and checks the one chosen', async () => {
    const user = userEvent.setup();
    render(<Kinds />);
    const rule = screen.getByRole('radio', { name: 'Rule' });
    expect(rule).not.toBeChecked();
    await user.click(rule);
    expect(rule).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Wish' })).not.toBeChecked();
  });

  it('clears when chosen again, which a native radio cannot do', async () => {
    const user = userEvent.setup();
    render(<Kinds />);
    await user.click(screen.getByRole('radio', { name: 'Wish' }));
    await user.click(screen.getByRole('radio', { name: 'Wish' }));
    expect(screen.getByRole('radio', { name: 'Wish' })).not.toBeChecked();
  });
});
