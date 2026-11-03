// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/agreements', () => {
  it('publishes the page, its reads and writes, the model, and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'AGREEMENTS_ENDPOINT',
        'AGREEMENTS_PATH',
        'AgreementSchema',
        'AgreementsPage',
        'DEFAULT_KINDS',
        'agreementsApi',
        'agreementsExtension',
        'dueForRevisit',
        'shownKind',
        'listed',
        'useAgreements',
      ].sort(),
    );
  });
});
