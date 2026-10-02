// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AuthenticationConfig } from '@zephyrex/auth/Router';
import { DEFAULT_AUTH_PATH } from '../../authPath';
import type { AuthPageDefinition, ZephyrexConfig } from '../../types';

/** The auth pages' settings from the app's config; nothing is read from the environment. */
export function authPagesConfig({
  app,
  auth,
  extensions = [],
}: Pick<ZephyrexConfig, 'app' | 'auth' | 'extensions'>): Partial<AuthenticationConfig> {
  return {
    appName: app.name,
    authPath: auth?.authPath ?? DEFAULT_AUTH_PATH,
    authModes: {
      basic: auth?.authModes?.basic ?? true,
      magical: extensions.some((extension) => extension.authModes?.magical === true),
    },
    oauthProviders: auth?.oauthProviders ?? [],
    signInAlternatives: extensions.flatMap((extension) => extension.signInAlternatives ?? []),
    ...(auth?.recaptchaSiteKey === undefined ? {} : { recaptchaSiteKey: auth.recaptchaSiteKey }),
  };
}

/** The auth pages the app's registered extensions add. */
export const extensionAuthPages = ({ extensions = [] }: Pick<ZephyrexConfig, 'extensions'>): AuthPageDefinition[] =>
  extensions.flatMap((extension) => extension.authPages ?? []);

/** Where the extensions' auth pages that need a signed-in user live on the app's origin. */
export const sessionOnlyAuthPaths = (config: Pick<ZephyrexConfig, 'auth' | 'extensions'>): string[] => {
  const authPath = config.auth?.authPath ?? DEFAULT_AUTH_PATH;
  return extensionAuthPages(config)
    .filter((page) => page.requiresSession === true)
    .map((page) => `${authPath}${page.path}`);
};
