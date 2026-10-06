// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { credentialsFixture, LAPTOP_ID } from './credentials.mocks';
import { Passkeys } from './Passkeys';
import { fakeAuthenticator, renderPasskeys } from './testing.mocks';

const ADD = 'Add a passkey';
const YOURS = 'Your passkeys';

describe('Passkeys', () => {
  let restore = (): void => undefined;

  afterEach(() => {
    restore();
    restore = (): void => undefined;
    vi.unstubAllGlobals();
  });

  it('lists the user’s passkeys newest first, with what each is and whether it can be used', async () => {
    const view = renderPasskeys(<Passkeys />);
    const items = within(await view.findByRole('list', { name: YOURS })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'YubiKeySecurity key (a second factor after your password)Never usedRenameRemove',
      expect.stringMatching(/^LaptopPasskey, synced across your devicesLast used .+RenameRemove$/),
      expect.stringMatching(/^Unnamed passkeyPasskey on one deviceDisabled .+Remove it\.RenameRemove$/),
    ]);
  });

  it('says where the browser can’t register passkeys', async () => {
    const view = renderPasskeys(<Passkeys />);
    expect(await view.findByText('This browser can’t register passkeys.')).toBeInTheDocument();
    expect(view.queryByRole('form', { name: ADD })).not.toBeInTheDocument();
  });

  it('registers a named passkey on this device', async () => {
    restore = fakeAuthenticator().restore;
    const store = credentialsFixture();
    const user = userEvent.setup();
    const view = renderPasskeys(<Passkeys />, store);
    const form = within(await view.findByRole('form', { name: ADD }));
    await user.type(form.getByLabelText('Name (optional)'), 'Phone');
    await user.selectOptions(form.getByLabelText('Where'), 'This device (a passkey)');
    await user.click(form.getByRole('button', { name: ADD }));
    expect(await form.findByRole('status')).toHaveTextContent('Added Phone.');
    expect(store.credentials.at(-1)).toMatchObject({ device_name: 'Phone' });
    expect(form.getByLabelText('Name (optional)')).toHaveValue('');
  });

  it('says so when the user cancels the browser’s request', async () => {
    restore = fakeAuthenticator(new DOMException('', 'NotAllowedError')).restore;
    const user = userEvent.setup();
    const view = renderPasskeys(<Passkeys />);
    await user.click(await view.findByRole('button', { name: ADD }));
    expect(await view.findByRole('alert')).toHaveTextContent('The request was cancelled, or it timed out.');
  });

  it('renames a passkey, and removes one', async () => {
    const store = credentialsFixture();
    const user = userEvent.setup();
    const view = renderPasskeys(<Passkeys />, store);
    const items = within(await view.findByRole('list', { name: YOURS })).getAllByRole('listitem');
    await user.click(within(nth(items, 1)).getByRole('button', { name: 'Rename' }));
    const rename = within(view.getByRole('form', { name: 'Rename Laptop' }));
    await user.clear(rename.getByLabelText('Name'));
    await user.type(rename.getByLabelText('Name'), 'Work laptop');
    await user.click(rename.getByRole('button', { name: 'Save name' }));
    await vi.waitFor(() => {
      expect(rowOf(store.credentials, LAPTOP_ID).device_name).toBe('Work laptop');
    });
    await user.click(within(nth(items, 2)).getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => {
      expect(store.credentials).toHaveLength(2);
    });
  });

  it('keeps the user’s name beside the passkey as it is now when it was renamed first', async () => {
    const store = credentialsFixture();
    const user = userEvent.setup();
    const view = renderPasskeys(<Passkeys />, store);
    const items = within(await view.findByRole('list', { name: YOURS })).getAllByRole('listitem');
    await user.click(within(nth(items, 1)).getByRole('button', { name: 'Rename' }));
    store.credentials = store.credentials.map((row) =>
      row.id === LAPTOP_ID ? { ...row, device_name: 'Renamed first', updated_at: '2026-10-05T08:00:00.000001' } : row,
    );
    const rename = within(view.getByRole('form', { name: 'Rename Laptop' }));
    await user.type(rename.getByLabelText('Name'), ' 2');
    await user.click(rename.getByRole('button', { name: 'Save name' }));
    expect(await view.findByRole('radio', { name: 'Current: Renamed first' })).not.toBeChecked();
  });

  it('says when the user has no passkeys', async () => {
    const view = renderPasskeys(<Passkeys />, { credentials: [] });
    expect(await view.findByText('You have no passkeys yet.')).toBeInTheDocument();
  });
});
