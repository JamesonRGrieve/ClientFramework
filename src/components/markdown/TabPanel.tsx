// SPDX-License-Identifier: AGPL-3.0-or-later
import type React from 'react';
import type { ReactNode } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  id: string;
  /** The id of the tab that names this panel; without one the panel stands alone, not as a tab panel. */
  labelledBy?: string | undefined;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}
export default function TabPanel({ children, value, index, id, labelledBy, className, ref }: TabPanelProps): ReactNode {
  return (
    <div
      {...(labelledBy === undefined ? {} : { role: 'tabpanel', 'aria-labelledby': labelledBy })}
      hidden={value !== index}
      className={className}
      ref={ref}
      id={id}
    >
      {value === index && <div>{children}</div>}
    </div>
  );
}
