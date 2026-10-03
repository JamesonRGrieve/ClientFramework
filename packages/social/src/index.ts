// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's social extension (zephyrex[social]): the record of what the
// server published to the user's social accounts. Posting happens server side; the accounts are
// provider instances, configured on the provider pages.
export { socialExtension } from './extension';
export { PublicationPage } from './PublicationPage';
export { PublicationsPage } from './PublicationsPage';
export { publicationPath, SOCIAL_PATH } from './routes';
export {
  linkTarget,
  platformName,
  SOCIAL_PUBLICATION_ENDPOINT,
  SocialPublicationSchema,
  useSocialPublication,
  useSocialPublications,
} from './socialApi';
export type { SocialPublication } from './socialApi';
