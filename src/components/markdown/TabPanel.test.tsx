// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TabPanel from './TabPanel';

describe('TabPanel', () => {
  it('is a tab panel named by its tab, showing its content only when selected', () => {
    const { rerender } = render(
      <>
        <button type='button' id='t0'>
          First
        </button>
        <TabPanel value={0} index={0} id='p0' labelledBy='t0'>
          Body
        </TabPanel>
      </>,
    );
    expect(screen.getByRole('tabpanel', { name: 'First' })).toHaveTextContent('Body');

    rerender(
      <>
        <button type='button' id='t0'>
          First
        </button>
        <TabPanel value={1} index={0} id='p0' labelledBy='t0'>
          Body
        </TabPanel>
      </>,
    );
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });

  it('is a plain region when no tab names it', () => {
    const { container } = render(
      <TabPanel value={0} index={0} id='p0'>
        Body
      </TabPanel>,
    );
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(container.querySelector('#p0')).toHaveTextContent('Body');
  });
});
