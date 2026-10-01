// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import mermaid from 'mermaid';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Mermaid from './Mermaid';

// jsdom has no SVG layout, so mermaid cannot draw here; the test checks what it is asked to do.
vi.mock('mermaid', () => ({
  default: { initialize: vi.fn(), run: vi.fn(async () => Promise.resolve()) },
}));

describe('Mermaid', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders untrusted charts in strict mode, and only its own node', () => {
    const { container } = render(<Mermaid chart='graph TD; A-->B' />);
    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ securityLevel: 'strict', startOnLoad: false }),
    );
    const node = container.querySelector('pre.mermaid');
    expect(node).toHaveTextContent('graph TD; A-->B');
    expect(mermaid.run).toHaveBeenCalledWith({ nodes: [node] });
  });

  it('renders again when the chart changes', () => {
    const { rerender } = render(<Mermaid chart='graph TD; A-->B' />);
    rerender(<Mermaid chart='graph TD; B-->C' />);
    expect(mermaid.run).toHaveBeenCalledTimes(2);
  });
});
