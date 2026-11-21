// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RetryRing } from './retry-ring';

const OFFSET = 'stroke-dashoffset';

const arc = (container: HTMLElement): Element => {
  const found = Array.from(container.querySelectorAll('circle')).at(-1);
  if (found === undefined) {
    throw new Error('The test expected the ring');
  }
  return found;
};

describe('RetryRing', () => {
  it('empties as the count runs, and is hidden from screen readers', () => {
    const full = render(<RetryRing secondsLeft={10} totalSeconds={10} retrying={false} />);
    expect(arc(full.container)).toHaveAttribute(OFFSET, '0');
    expect(full.container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    const part = render(<RetryRing secondsLeft={3} totalSeconds={10} retrying={false} />);
    expect(arc(part.container)).toHaveAttribute(OFFSET, '70');
  });

  it('spins a quarter ring while a try is under way', () => {
    const { container } = render(<RetryRing secondsLeft={10} totalSeconds={10} retrying />);
    expect(container.querySelector('svg')).toHaveClass('animate-spin');
    expect(arc(container)).toHaveAttribute(OFFSET, '75');
  });
});
