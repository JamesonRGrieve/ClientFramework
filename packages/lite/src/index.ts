// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * @zephyrex/lite: the API a Zephyrex app's lite edition answers from its own Next.js route
 * handlers, in exactly the shape server-framework answers it, so one UI runs on either back end.
 * Server-only: import it from `route.lite.ts` handlers, never from a client component.
 */
export {
  ApiError,
  apiErrorResponse,
  type ErrorDetail,
  logUnexpected,
  recordError,
  setErrorReporter,
  validationError,
} from './apiErrors';
export { entityTag, evaluateIfMatch, type IfMatchResult, nextUpdateStamp } from './conditionalRequest';
export { LOCAL_OWNER_ID, localOwner } from './localOwner';
export {
  collectionRoutes,
  frameworkTimestamp,
  notFound,
  type Owner,
  type OwnerResolver,
  type RecordRow,
  type ResourceSpec,
  recordRoutes,
  toDto,
} from './records';
export { MAX_BODY_BYTES, optionalString, readJsonObject, requiredString } from './requestBody';
export { STATUS } from './status';
