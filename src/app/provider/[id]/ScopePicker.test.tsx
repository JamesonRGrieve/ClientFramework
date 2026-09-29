// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScopePicker } from './ScopePicker';

const options = [{ value: 'p1', label: 'OpenAI' }];

describe('ScopePicker', () => {
  it('labels its picker and shows the "any" choice when nothing is selected', () => {
    const view = render(
      <ScopePicker id='scope' label='Provider' anyLabel='All providers' value={null} options={options} onChange={vi.fn()} />,
    );
    expect(view.getByLabelText('Provider')).toHaveTextContent('All providers');
  });

  it('shows the selected option', () => {
    const view = render(
      <ScopePicker id='scope' label='Provider' anyLabel='All providers' value='p1' options={options} onChange={vi.fn()} />,
    );
    expect(view.getByLabelText('Provider')).toHaveTextContent('OpenAI');
  });

  it('shows the placeholder and is disabled when there is nothing to choose', () => {
    const view = render(
      <ScopePicker
        id='scope'
        label='Instance'
        placeholder='No instances in scope'
        value={null}
        options={[]}
        onChange={vi.fn()}
      />,
    );
    const picker = view.getByLabelText('Instance');
    expect(picker).toBeDisabled();
    expect(picker).toHaveTextContent('No instances in scope');
  });
});
