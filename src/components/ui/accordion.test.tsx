// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

describe('Accordion', () => {
  it('renders without crashing', () => {
    const { container } = render(<Accordion>content</Accordion>);
    expect(container).toBeInTheDocument();
  });
});
