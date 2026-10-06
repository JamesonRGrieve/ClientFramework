// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RotationPicker } from './RotationPicker';
import { renderAgents } from './testing.mocks';

const PICKER = 'Thinks with';

describe('RotationPicker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('offers the default models and each rotation, and says which is chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = renderAgents(<RotationPicker value={null} onChange={onChange} />);
    expect(await view.findByRole('option', { name: 'Fast models' })).toBeInTheDocument();
    expect(view.getByLabelText(PICKER)).toHaveValue('');
    await user.selectOptions(view.getByLabelText(PICKER), 'Fast models');
    expect(onChange).toHaveBeenLastCalledWith('fast');
  });

  it('chooses no rotation for the default models', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = renderAgents(<RotationPicker value='fast' onChange={onChange} />);
    expect(await view.findByLabelText(PICKER)).toHaveValue('fast');
    await user.selectOptions(view.getByLabelText(PICKER), 'The default models');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
