// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AuthenticationConfig } from '@zephyrex/auth/Router';
import { DEFAULT_AUTH_PATH } from '../../authPath';
import type { ZephyrexConfig } from '../../types';

/** The auth pages' settings from the app's config; nothing is read from the environment. */
export function authPagesConfig({ app, auth }: Pick<ZephyrexConfig, 'app' | 'auth'>): Partial<AuthenticationConfig> {
  return {
    appName: app.name,
    authPath: auth?.authPath ?? DEFAULT_AUTH_PATH,
    authModes: auth?.authModes ?? { basic: true, magical: false },
    oauthProviders: auth?.oauthProviders ?? [],
    ...(auth?.recaptchaSiteKey === undefined ? {} : { recaptchaSiteKey: auth.recaptchaSiteKey }),
  };
}
