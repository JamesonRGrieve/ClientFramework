// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const renderAccordion = (type?: 'single' | 'multiple'): ReturnType<typeof render> =>
  render(
    <Accordion {...(type === undefined ? {} : { type })}>
      <AccordionItem value='first item'>
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent>First body</AccordionContent>
      </AccordionItem>
      <AccordionItem value='second'>
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Second body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );

describe('Accordion', () => {
  beforeAll(() => {
    // jsdom has no layout, so no scrollIntoView.
    Element.prototype.scrollIntoView = () => undefined;
  });

  it('starts closed, and a trigger says so and names the panel it controls', async () => {
    const user = userEvent.setup();
    renderAccordion();
    const trigger = screen.getByRole('button', { name: 'First' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region', { name: 'First' });
    expect(panel).toHaveTextContent('First body');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
  });

  it('keeps one item open at a time by default', async () => {
    const user = userEvent.setup();
    renderAccordion();
    await user.click(screen.getByRole('button', { name: 'First' }));
    await user.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getAllByRole('region').map((panel) => panel.textContent)).toEqual(['Second body']);
  });

  it('lets items open independently when multiple', async () => {
    const user = userEvent.setup();
    renderAccordion('multiple');
    await user.click(screen.getByRole('button', { name: 'First' }));
    await user.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getAllByRole('region')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'First' }));
    expect(screen.getAllByRole('region').map((panel) => panel.textContent)).toEqual(['Second body']);
  });

  it('opens the default item', () => {
    render(
      <Accordion defaultValue='a'>
        <AccordionItem value='a'>
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('region', { name: 'A' })).toHaveTextContent('A body');
  });
});
