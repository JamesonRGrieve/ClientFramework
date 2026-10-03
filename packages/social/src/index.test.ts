// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/social', () => {
  it('publishes the posts pages, their reads and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'PublicationPage',
        'PublicationsPage',
        'SOCIAL_PATH',
        'SOCIAL_PUBLICATION_ENDPOINT',
        'SocialPublicationSchema',
        'linkTarget',
        'platformName',
        'publicationPath',
        'socialExtension',
        'useSocialPublication',
        'useSocialPublications',
      ].sort(),
    );
    expect(published.SOCIAL_PUBLICATION_ENDPOINT).toBe('/v1/social_publication');
  });
});
