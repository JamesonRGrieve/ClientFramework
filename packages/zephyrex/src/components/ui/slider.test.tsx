// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slider } from './slider';

describe('Slider', () => {
  it('names its thumb, the element a screen reader lands on', () => {
    render(<Slider aria-label='Volume' defaultValue={[40]} />);
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute('aria-valuenow', '40');
  });

  it('takes its name from a label by id', () => {
    render(
      <>
        <span id='speed-label'>Reading speed</span>
        <Slider aria-labelledby='speed-label' defaultValue={[2]} max={5} />
      </>,
    );
    expect(screen.getByRole('slider', { name: 'Reading speed' })).toBeInTheDocument();
  });
});
