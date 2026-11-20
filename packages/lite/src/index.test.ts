// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as lite from './index';

describe('@zephyrex/lite', () => {
  it('exports the record handlers, the owner and the request helpers', () => {
    expect(Object.keys(lite).sort()).toEqual(
      [
        'ApiError',
        'LOCAL_OWNER_ID',
        'MAX_BODY_BYTES',
        'apiErrorResponse',
        'setErrorReporter',
        'STATUS',
        'collectionRoutes',
        'entityTag',
        'evaluateIfMatch',
        'frameworkTimestamp',
        'localOwner',
        'nextUpdateStamp',
        'notFound',
        'optionalString',
        'readJsonObject',
        'recordError',
        'recordRoutes',
        'requiredString',
        'toDto',
        'validationError',
      ].sort(),
    );
  });
});
