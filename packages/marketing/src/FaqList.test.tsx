// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FaqList } from './FaqList';
import { FAQS } from './marketing.mocks';

describe('FaqList', () => {
  it('opens an answer from its question', async () => {
    render(<FaqList faqs={FAQS} />);
    const question = screen.getByText('Is it free?');
    const details = question.closest('details');
    expect(details).not.toHaveAttribute('open');
    await userEvent.click(question);
    expect(details).toHaveAttribute('open');
  });
});
