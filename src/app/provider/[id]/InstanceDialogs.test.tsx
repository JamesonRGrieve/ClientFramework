// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type InstanceDialog, InstanceDialogs } from './InstanceDialogs';

const instance = { id: 'i1', name: 'GPT', provider_id: 'p1', created_at: '2026-09-01T00:00:00Z' };

const renderDialogs = (
  open: InstanceDialog,
): { view: ReturnType<typeof render>; handlers: Record<string, ReturnType<typeof vi.fn>> } => {
  const handlers = {
    onClose: vi.fn(),
    onCreate: vi.fn(async () => Promise.resolve()),
    onRename: vi.fn(async () => Promise.resolve()),
    onDelete: vi.fn(async () => Promise.resolve()),
  };
  const view = render(<InstanceDialogs open={open} providerLabel='OpenAI' instance={instance} {...handlers} />);
  return { view, handlers };
};

describe('InstanceDialogs', () => {
  it('creates an instance of the chosen provider from the labelled fields, API key masked', async () => {
    const user = userEvent.setup();
    const { view, handlers } = renderDialogs('create');
    expect(view.getByRole('heading', { name: 'New OpenAI instance' })).toBeInTheDocument();
    expect(view.getByLabelText('API key')).toHaveAttribute('type', 'password');
    await user.type(view.getByLabelText('Name'), ' Main ');
    await user.type(view.getByLabelText('Model name'), 'gpt-5');
    await user.type(view.getByLabelText('API key'), 'sk-1');
    await user.click(view.getByRole('button', { name: 'Create' }));
    expect(handlers['onCreate']).toHaveBeenCalledWith({ name: 'Main', modelName: 'gpt-5', apiKey: 'sk-1' });
  });

  it('renames starting from the current name', async () => {
    const user = userEvent.setup();
    const { view, handlers } = renderDialogs('rename');
    const field = view.getByLabelText('New name');
    expect(field).toHaveValue('GPT');
    await user.clear(field);
    await user.type(field, 'GPT-5');
    await user.click(view.getByRole('button', { name: 'Rename' }));
    expect(handlers['onRename']).toHaveBeenCalledWith('GPT-5');
  });

  it('asks before deleting and can be cancelled', async () => {
    const user = userEvent.setup();
    const { view, handlers } = renderDialogs('delete');
    expect(view.getByRole('heading', { name: 'Delete GPT?' })).toBeInTheDocument();
    await user.click(view.getByRole('button', { name: 'Cancel' }));
    expect(handlers['onClose']).toHaveBeenCalled();
    expect(handlers['onDelete']).not.toHaveBeenCalled();
    await user.click(view.getByRole('button', { name: 'Delete' }));
    expect(handlers['onDelete']).toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    const { view } = renderDialogs(null);
    expect(view.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
