// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { needsClientDirective } from './client-directive.mjs';

const SPDX = '// SPDX-License-Identifier: AGPL-3.0-or-later\n';
const USES_STATE = "import { useState } from 'react';\nexport const C = () => { const [v] = useState(0); return v; };\n";

describe('needsClientDirective', () => {
  it('flags a module that calls a browser-only hook without the directive', () => {
    expect(needsClientDirective(SPDX + USES_STATE)).toBe(true);
    expect(needsClientDirective('export const C = () => React.useEffect(() => undefined, []);\n')).toBe(true);
  });

  it('accepts the directive before or after leading comments', () => {
    expect(needsClientDirective(`'use client';\n${SPDX}${USES_STATE}`)).toBe(false);
    expect(needsClientDirective(`${SPDX}"use client";\n${USES_STATE}`)).toBe(false);
  });

  it('ignores a "use client" that is not the leading directive', () => {
    expect(needsClientDirective(`${USES_STATE}const note = 'use client';\n`)).toBe(true);
  });

  it('leaves alone modules that only use hooks React’s server build has', () => {
    expect(needsClientDirective('export const C = () => { const id = useId(); return useMemo(() => id, [id]); };\n')).toBe(
      false,
    );
    expect(needsClientDirective('export const plain = 1;\n')).toBe(false);
  });
});
