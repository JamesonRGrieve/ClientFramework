// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PasswordPolicy } from '@zephyrex/auth/lib/passwordPolicy';
import { ApiError } from '../../../client';
import { Account } from './Account';

type View = ReturnType<typeof render>;

const CURRENT = 'Current password';
const NEXT = 'New password';
const AGAIN = 'New password (again)';
const OLD_SECRET = 'old-secret';
const NEW_SECRET = 'new-secret';
const INVALID = 'aria-invalid';
const WRONG_CURRENT = 'Current password is incorrect';

const HTTP_UNPROCESSABLE = 422;
const POLICY: PasswordPolicy = { min_length: 8, max_bytes: 72, require_letter: true, require_digit: true };

const fill = async (view: View, current: string, next: string, again: string): Promise<void> => {
  const user = userEvent.setup();
  if (current !== '') {
    await user.type(view.getByLabelText(CURRENT), current);
  }
  if (next !== '') {
    await user.type(view.getByLabelText(NEXT), next);
  }
  if (again !== '') {
    await user.type(view.getByLabelText(AGAIN), again);
  }
  await user.click(view.getByRole('button', { name: 'Change password' }));
};

describe('Account', () => {
  it('sends the current and new password, then clears the form', async () => {
    const onChangePassword = vi.fn(async () => Promise.resolve('Password changed successfully'));
    const view = render(<Account onChangePassword={onChangePassword} passwordPolicy={undefined} />);
    await fill(view, OLD_SECRET, NEW_SECRET, NEW_SECRET);
    expect(onChangePassword).toHaveBeenCalledWith(OLD_SECRET, NEW_SECRET);
    expect(await view.findByRole('status')).toHaveTextContent('Password changed successfully');
    expect(view.getByLabelText(CURRENT)).toHaveValue('');
    expect(view.getByLabelText(NEXT)).toHaveValue('');
  });

  it('stops a mismatched confirmation before it reaches the server', async () => {
    const onChangePassword = vi.fn(async () => Promise.resolve(''));
    const view = render(<Account onChangePassword={onChangePassword} passwordPolicy={undefined} />);
    await fill(view, OLD_SECRET, NEW_SECRET, 'new-secert');
    expect(onChangePassword).not.toHaveBeenCalled();
    expect(view.getByRole('alert')).toHaveTextContent('The new passwords do not match.');
    const again = view.getByLabelText(AGAIN);
    expect(again).toHaveAttribute(INVALID, 'true');
    expect(again).toHaveAccessibleDescription('The new passwords do not match.');
    expect(view.getByLabelText(NEXT)).toHaveAttribute(INVALID, 'false');
    expect(view.getByLabelText(NEXT)).not.toHaveAttribute('aria-describedby');
  });

  it('marks a missing current password on that field', async () => {
    const view = render(<Account onChangePassword={vi.fn(async () => Promise.resolve(''))} passwordPolicy={undefined} />);
    await fill(view, '', NEW_SECRET, NEW_SECRET);
    const current = view.getByLabelText(CURRENT);
    expect(current).toHaveAttribute(INVALID, 'true');
    expect(current).toHaveAccessibleDescription('Enter your current password.');
  });

  it('shows the server’s refusal', async () => {
    const onChangePassword = vi.fn(async () => Promise.reject(new Error(WRONG_CURRENT)));
    const view = render(<Account onChangePassword={onChangePassword} passwordPolicy={undefined} />);
    await fill(view, 'wrong', NEW_SECRET, NEW_SECRET);
    expect(await view.findByRole('alert')).toHaveTextContent(WRONG_CURRENT);
    // The server does not say which field is wrong, so every field is described by it and none blamed.
    const current = view.getByLabelText(CURRENT);
    expect(current).toHaveAccessibleDescription(WRONG_CURRENT);
    expect(current).toHaveAttribute(INVALID, 'false');
  });

  it('describes the new password with the server’s rule, following what is typed', async () => {
    const view = render(<Account onChangePassword={vi.fn(async () => Promise.resolve(''))} passwordPolicy={POLICY} />);
    const next = view.getByLabelText(NEXT);
    expect(next).toHaveAccessibleDescription(/At least 8 characters/);
    await userEvent.setup().type(next, 'abcdefgh');
    expect(view.getByRole('list', { name: 'Password requirements' })).toHaveTextContent('At least one digit: not met yet');
  });

  it('stops a new password that breaks the policy before it reaches the server', async () => {
    const onChangePassword = vi.fn(async () => Promise.resolve(''));
    const view = render(<Account onChangePassword={onChangePassword} passwordPolicy={POLICY} />);
    await fill(view, OLD_SECRET, 'abcdefgh', 'abcdefgh');
    expect(onChangePassword).not.toHaveBeenCalled();
    expect(view.getByRole('alert')).toHaveTextContent('The new password does not meet the requirements.');
    expect(view.getByLabelText(NEXT)).toHaveAttribute(INVALID, 'true');
  });

  it('marks the rules the server says the new password broke', async () => {
    const refusal = new ApiError(
      HTTP_UNPROCESSABLE,
      '{"detail":{"message":"Password does not meet the policy","failed":["require_digit"]}}',
    );
    const view = render(<Account onChangePassword={vi.fn(async () => Promise.reject(refusal))} passwordPolicy={POLICY} />);
    await fill(view, OLD_SECRET, 'abcdefg1', 'abcdefg1');
    expect(await view.findByRole('alert')).toHaveTextContent('Password does not meet the policy');
    expect(view.getByLabelText(NEXT)).toHaveAttribute(INVALID, 'true');
    expect(view.getByText(/At least one digit/)).toHaveTextContent('At least one digit: not met yet');
  });
});
