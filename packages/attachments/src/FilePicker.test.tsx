// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilePicker } from './FilePicker';

const LABEL = 'Add a file';

const file = (name: string, type: string, bytes = 'data'): File => new File([bytes], name, { type });

const input = (container: HTMLElement): HTMLInputElement => {
  const found = container.querySelector('input[type=file]');
  if (!(found instanceof HTMLInputElement)) {
    throw new Error('The test expected a file input');
  }
  return found;
};

describe('FilePicker', () => {
  it('hands on a file the server would take', async () => {
    const onFile = vi.fn(async () => Promise.resolve());
    const user = userEvent.setup({ applyAccept: false });
    const view = render(<FilePicker label={LABEL} onFile={onFile} />);
    await user.upload(input(view.container), file('map.png', 'image/png'));
    expect(onFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'map.png' }));
    expect(view.queryByRole('alert')).toBeNull();
  });

  it('refuses a file the server would refuse, in its words, and names it on the button', async () => {
    const onFile = vi.fn(async () => Promise.resolve());
    const user = userEvent.setup({ applyAccept: false });
    const view = render(<FilePicker label={LABEL} onFile={onFile} />);
    await user.upload(input(view.container), file('page.html', 'text/html'));
    expect(onFile).not.toHaveBeenCalled();
    expect(view.getByRole('alert')).toHaveTextContent('That kind of file can’t go here');
    expect(view.getByRole('button', { name: LABEL })).toHaveAccessibleDescription('That kind of file can’t go here');
    await user.upload(input(view.container), file('empty.pdf', 'application/pdf', ''));
    expect(view.getByRole('alert')).toHaveTextContent('The file is empty');
  });

  it('shows why saving failed when the file was taken but not saved', async () => {
    const onFile = vi.fn(async () => Promise.reject(new Error('Record not found')));
    const user = userEvent.setup({ applyAccept: false });
    const view = render(<FilePicker label={LABEL} onFile={onFile} />);
    await user.upload(input(view.container), file('map.png', 'image/png'));
    expect(await view.findByRole('alert')).toHaveTextContent('Record not found');
  });

  it('shows the upload’s progress and last error, and is off while uploading', () => {
    const view = render(
      <FilePicker
        label={LABEL}
        onFile={vi.fn()}
        uploading
        progress={{ loaded: 5, total: 10, percent: 50 }}
        error={new Error('Upload failed: 500')}
      />,
    );
    expect(view.getByRole('button', { name: 'Uploading…' })).toBeDisabled();
    expect(view.getByRole('progressbar', { name: `${LABEL}: uploading` })).toBeInTheDocument();
    expect(view.getByRole('alert')).toHaveTextContent('Upload failed: 500');
  });
});
