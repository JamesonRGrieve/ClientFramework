// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Disclosure, DisclosureContent, DisclosureTrigger } from './disclosure';

const EXPANDED = 'aria-expanded';

describe('Disclosure', () => {
  it('toggles its content from the trigger, which says it is expanded and names the content', async () => {
    const user = userEvent.setup();
    render(
      <Disclosure>
        <DisclosureTrigger>
          <span>More</span>
        </DisclosureTrigger>
        <DisclosureContent>Hidden text</DisclosureContent>
      </Disclosure>,
    );
    const trigger = screen.getByRole('button', { name: 'More' });
    expect(trigger).toHaveAttribute(EXPANDED, 'false');
    expect(screen.queryByText('Hidden text')).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute(EXPANDED, 'true');
    const content = await screen.findByText('Hidden text');
    expect(trigger).toHaveAttribute('aria-controls', content.id);
  });

  it('opens from the keyboard', async () => {
    const user = userEvent.setup();
    render(
      <Disclosure>
        <DisclosureTrigger>
          <span>More</span>
        </DisclosureTrigger>
        <DisclosureContent>Hidden text</DisclosureContent>
      </Disclosure>,
    );
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute(EXPANDED, 'true');
  });

  it('keeps the toggle when the trigger child has its own click handler, and runs that too', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Disclosure onOpenChange={onOpenChange}>
        <DisclosureTrigger>
          <button type='button' onClick={onClick} aria-expanded={false}>
            More
          </button>
        </DisclosureTrigger>
        <DisclosureContent>Hidden text</DisclosureContent>
      </Disclosure>,
    );
    const trigger = screen.getByRole('button', { name: 'More' });
    await user.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute(EXPANDED, 'true');
  });

  it('refuses anything but a trigger and a content', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Disclosure>content</Disclosure>)).toThrow(/exactly two children/);
    errSpy.mockRestore();
  });
});
