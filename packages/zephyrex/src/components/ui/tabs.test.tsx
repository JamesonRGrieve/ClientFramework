// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

describe('Tabs', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tabs>content</Tabs>);
    expect(container).toBeInTheDocument();
  });

  it('brings a chosen tab’s content in with a short fade, unless motion is reduced', async () => {
    const view = render(
      <Tabs defaultValue='one'>
        <TabsList>
          <TabsTrigger value='one'>One</TabsTrigger>
          <TabsTrigger value='two'>Two</TabsTrigger>
        </TabsList>
        <TabsContent value='one'>First</TabsContent>
        <TabsContent value='two'>Second</TabsContent>
      </Tabs>,
    );
    await userEvent.setup().click(view.getByRole('tab', { name: 'Two' }));
    const panel = view.getByRole('tabpanel', { name: 'Two' });
    expect(panel).toHaveTextContent('Second');
    expect(panel).toHaveClass('data-[state=active]:animate-in', 'motion-reduce:animate-none');
  });
});
