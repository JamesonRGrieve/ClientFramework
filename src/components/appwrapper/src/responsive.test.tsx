// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CenterAlignedBox from './AppWrapperCenterAlignedBox';

describe('CenterAlignedBox — responsive layout', () => {
  it('renders all three sections', () => {
    const { container } = render(
      <CenterAlignedBox left="Left" center="Center" right="Right" />,
    );
    expect(container.textContent).toContain('Left');
    expect(container.textContent).toContain('Center');
    expect(container.textContent).toContain('Right');
  });

  it('uses flex-nowrap to prevent wrapping', () => {
    const { container } = render(
      <CenterAlignedBox left="L" center="C" right="R" />,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('flex-nowrap');
  });

  it('left and right sections have min-w constraint for mobile', () => {
    const { container } = render(
      <CenterAlignedBox left="L" center="C" right="R" />,
    );
    const children = container.firstElementChild?.children;
    expect(children).toBeDefined();
    if (children) {
      const left = children[0] as HTMLElement;
      const right = children[2] as HTMLElement;
      expect(left.className).toContain('min-w-[25%]');
      expect(right.className).toContain('min-w-[25%]');
    }
  });

  it('center section uses flex-none to prevent shrinking', () => {
    const { container } = render(
      <CenterAlignedBox left="L" center="C" right="R" />,
    );
    const center = container.firstElementChild?.children[1] as HTMLElement;
    expect(center.className).toContain('flex-none');
  });

  it('handles missing sections gracefully', () => {
    const { container } = render(<CenterAlignedBox />);
    const children = container.firstElementChild?.children;
    expect(children?.length).toBe(3);
  });
});
