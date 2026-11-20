// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InlineText } from './inline-text';

const LABEL = 'Gift title';
const EDIT = { name: 'Gift title: Peonies. Edit' };

describe('InlineText', () => {
  it('saves the new text on Enter', async () => {
    const save = vi.fn(() => Promise.resolve(null));
    const user = userEvent.setup();
    const view = render(<InlineText value='Peonies' label={LABEL} onSave={save} />);
    await user.click(view.getByRole('button', EDIT));
    const field = view.getByRole('textbox', { name: LABEL });
    expect(field).toHaveFocus();
    await user.clear(field);
    await user.type(field, 'Tulips{Enter}');
    expect(save).toHaveBeenCalledWith('Tulips');
    expect(view.queryByRole('textbox')).toBeNull();
  });

  it('puts the text back on Escape, saving nothing', async () => {
    const save = vi.fn(() => Promise.resolve(null));
    const user = userEvent.setup();
    const view = render(<InlineText value='Peonies' label={LABEL} onSave={save} />);
    await user.click(view.getByRole('button', EDIT));
    await user.type(view.getByRole('textbox', { name: LABEL }), ' and roses{Escape}');
    expect(save).not.toHaveBeenCalled();
    expect(view.getByRole('button', EDIT)).toBeInTheDocument();
  });

  it('stays open with the reason when saving fails', async () => {
    const save = vi.fn(() => Promise.resolve('The gift could not be saved.'));
    const user = userEvent.setup();
    const view = render(<InlineText value='Peonies' label={LABEL} onSave={save} />);
    await user.click(view.getByRole('button', EDIT));
    await user.type(view.getByRole('textbox', { name: LABEL }), '!{Enter}');
    expect(await view.findByRole('alert')).toHaveTextContent('The gift could not be saved.');
    expect(view.getByRole('textbox', { name: LABEL })).toBeInTheDocument();
  });
});
