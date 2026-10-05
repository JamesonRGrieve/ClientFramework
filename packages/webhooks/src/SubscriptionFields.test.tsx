// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SubscriptionFields } from './SubscriptionFields';
import type { SubscriptionDraft } from './webhookModel';

const START: SubscriptionDraft = { target_url: '', event_types: '*', active: true, secret: '' };

function Editing({ secretRequired }: { secretRequired: boolean }): ReturnType<typeof SubscriptionFields> {
  const [draft, setDraft] = useState(START);
  return (
    <>
      <SubscriptionFields draft={draft} onChange={setDraft} secretRequired={secretRequired} />
      <output aria-label='Draft'>{JSON.stringify(draft)}</output>
    </>
  );
}

describe('SubscriptionFields', () => {
  it('edits each field, and generates a secret into the secret field', async () => {
    const user = userEvent.setup();
    const view = render(<Editing secretRequired />);
    await user.type(view.getByLabelText('Deliver to (URL)'), 'https://x.example/h');
    await user.clear(view.getByLabelText('Events'));
    await user.type(view.getByLabelText('Events'), 'order.created');
    await user.click(view.getByLabelText('Deliver events (uncheck to pause)'));
    await user.click(view.getByRole('button', { name: 'Generate' }));
    expect(view.getByLabelText('Signing secret')).toHaveDisplayValue(/^[\da-f]{64}$/);
    expect(view.getByLabelText('Draft')).toHaveTextContent(
      '{"target_url":"https://x.example/h","event_types":"order.created","active":false,"secret":"',
    );
  });

  it('asks for a new secret only optionally when editing', () => {
    const view = render(<Editing secretRequired={false} />);
    expect(view.getByLabelText('New signing secret (optional)')).toHaveValue('');
    expect(view.getByText(/Leave blank to keep the current one/)).toBeInTheDocument();
  });
});
