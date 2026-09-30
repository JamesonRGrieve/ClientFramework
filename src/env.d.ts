// SPDX-License-Identifier: AGPL-3.0-or-later
// Ambient typings for the environment variables this framework reads. Declaring each
// as a named optional property lets `process.env.FOO` type-check under
// noPropertyAccessFromIndexSignature while keeping the value `string | undefined`, so
// callers must still handle absence.
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_URI?: string;
      AUDIO_PROXY_ALLOWED_HOSTS?: string;
      LANDING_ONLY?: string;
      LOG_VERBOSITY_SERVER?: string;
      NEXT_PUBLIC_ADSENSE_ACCOUNT?: string;
      NEXT_PUBLIC_APP_DESCRIPTION?: string;
      NEXT_PUBLIC_APP_LOGO_URI?: string;
      NEXT_PUBLIC_APP_NAME?: string;
      NEXT_PUBLIC_APP_URI?: string;
      NEXT_PUBLIC_COOKIE_DOMAIN?: string;
      NEXT_PUBLIC_LOG_VERBOSITY_CLIENT?: string;
      NEXT_PUBLIC_THEME_DEFAULT_MODE?: string;
      PRIVATE_ROUTES?: string;
    }
  }
}
