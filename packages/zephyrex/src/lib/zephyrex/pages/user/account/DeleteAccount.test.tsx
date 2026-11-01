// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeleteAccount } from './DeleteAccount';

const DELETE = 'Delete my account';
const CONFIRM = 'Type “delete” to confirm';

describe('DeleteAccount', () => {
  it('deletes only once "delete" is typed', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn(async () => Promise.resolve());
    const view = render(<DeleteAccount onDelete={onDelete} />);
    const button = view.getByRole('button', { name: DELETE });
    expect(button).toBeDisabled();
    await user.type(view.getByLabelText(CONFIRM), 'delet');
    expect(button).toBeDisabled();
    await user.type(view.getByLabelText(CONFIRM), 'e');
    await user.click(button);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("says what goes, in the app's words", () => {
    const view = render(<DeleteAccount onDelete={vi.fn()} note='Your tree goes; others keep theirs.' />);
    expect(view.getByText('Your tree goes; others keep theirs.')).toBeInTheDocument();
  });

  it('says why when the account could not be deleted, and lets the user try again', async () => {
    const user = userEvent.setup();
    const view = render(
      <DeleteAccount onDelete={vi.fn(async () => Promise.reject(new Error('Your account was kept. Try again.')))} />,
    );
    await user.type(view.getByLabelText(CONFIRM), 'delete');
    await user.click(view.getByRole('button', { name: DELETE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Your account was kept. Try again.');
    expect(view.getByRole('button', { name: DELETE })).toBeEnabled();
  });
});
