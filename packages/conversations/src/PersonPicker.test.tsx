// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ADA, CHARLES } from './conversations.mocks';
import { PersonPicker } from './PersonPicker';

describe('PersonPicker', () => {
  it('offers the people by name, and reports the one chosen or nobody', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = render(<PersonPicker label='Message' people={[ADA, CHARLES]} value={null} onChange={onChange} />);
    const picker = view.getByLabelText('Message');
    expect([...picker.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'Choose someone…',
      'Ada Lovelace',
      'Babbage',
    ]);
    await user.selectOptions(picker, 'Babbage');
    expect(onChange).toHaveBeenLastCalledWith(CHARLES.id);
    view.rerender(<PersonPicker label='Message' people={[ADA, CHARLES]} value={CHARLES.id} onChange={onChange} />);
    await user.selectOptions(picker, 'Choose someone…');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
