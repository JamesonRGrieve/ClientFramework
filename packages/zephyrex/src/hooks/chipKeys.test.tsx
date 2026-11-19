// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { chipGroup, chipKeys } from './chipKeys';

function Group({ disabled = false }: { disabled?: boolean }): React.ReactElement {
  return (
    <div role='group' aria-label='Choices'>
      <div className='contents' ref={chipGroup}>
        <button type='button'>One</button>
        <button type='button' disabled={disabled}>
          Two
        </button>
        <input aria-label='Date' type='date' />
        <button type='button'>Three</button>
      </div>
    </div>
  );
}

const press = (key: string): void => {
  fireEvent.keyDown(document.activeElement ?? document.body, { key });
};
const focused = (): string | null => document.activeElement?.textContent ?? null;

describe('chipKeys', () => {
  it('moves to the next and previous chip, wrapping, and skips the input', () => {
    render(<Group />);
    screen.getByRole('button', { name: 'One' }).focus();
    press('ArrowRight');
    expect(focused()).toBe('Two');
    press('ArrowRight');
    expect(focused()).toBe('Three');
    press('ArrowRight');
    expect(focused()).toBe('One');
    press('ArrowLeft');
    expect(focused()).toBe('Three');
  });

  it('jumps to the ends with Home and End', () => {
    render(<Group />);
    screen.getByRole('button', { name: 'Two' }).focus();
    press('End');
    expect(focused()).toBe('Three');
    press('Home');
    expect(focused()).toBe('One');
  });

  it('skips disabled chips', () => {
    render(<Group disabled />);
    screen.getByRole('button', { name: 'One' }).focus();
    press('ArrowRight');
    expect(focused()).toBe('Three');
  });

  it('leaves the keys alone while the input has focus', () => {
    render(<Group />);
    const date = screen.getByLabelText('Date');
    date.focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(date);
  });
});

describe('chipKeys as a handler', () => {
  it('works on a key handler too', () => {
    render(
      <div role='toolbar' aria-label='Choices' tabIndex={-1} onKeyDown={chipKeys}>
        <button type='button'>One</button>
        <button type='button'>Two</button>
      </div>,
    );
    screen.getByRole('button', { name: 'One' }).focus();
    press('ArrowRight');
    expect(focused()).toBe('Two');
  });
});
