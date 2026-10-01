// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

// `storybook build` succeeds even when preview.tsx throws as it loads, and then every story renders
// blank; loading the module here is what catches that.
describe('Storybook preview', () => {
  it('loads, with the msw loader that serves the stories their mocked API', async () => {
    const { default: preview } = await import('./preview');
    expect(preview.loaders).toHaveLength(1);
    expect(preview.loaders[0]).toBeTypeOf('function');
  });
});
