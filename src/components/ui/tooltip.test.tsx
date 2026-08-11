// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

describe('Tooltip', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Tooltip>
        content
      </Tooltip>
    );
    expect(container).toBeInTheDocument();
  });
});
