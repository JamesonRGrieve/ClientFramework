# TODOS

## 1. Framework (Root)

### 1.1 Security
- [ ] 1.1.1 **CRITICAL:** `next.config.js:154-159` — `allowedOrigins: ['*']` and `allowedForwardedHosts: ['*']` on server actions bypasses origin validation entirely; restrict to trusted domains
- [ ] 1.1.2 **HIGH:** Add security headers in `next.config.js` `headers()` — missing `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`
- [ ] 1.1.3 **HIGH:** Remove `fs` from package.json dependencies (line 99) — `fs` is a Node.js core module and should never be installed via npm
- [ ] 1.1.4 `CodeBlock.tsx` uses `dangerouslySetInnerHTML` (line 84) without sanitization — potential XSS; use DOMPurify or equivalent
- [ ] 1.1.5 `server-wrapper.js:14` — global `__RUNTIME_CONFIG__` exposes runtime variables without validation

### 1.2 Testing
- [ ] 1.2.1 Add Vitest configuration at project root (mirroring mesh-map's `vite.config.ts` test section)
- [ ] 1.2.2 Create `src/__tests__/setup.ts` with mocks for Next.js router, fetch, and shared UI dependencies
- [ ] 1.2.3 Add unit tests for `src/lib/objects.ts` (deepMerge, deepMergeJSON)
- [ ] 1.2.4 Add unit tests for `src/lib/utils.ts` (cn utility)
- [ ] 1.2.5 Add unit tests for `src/lib/validation.ts` (URI validation)
- [ ] 1.2.6 Add unit tests for `src/lib/time-ago.ts` (relative time formatting)
- [ ] 1.2.7 Add unit tests for `src/hooks/useToast.ts`
- [ ] 1.2.8 Add unit tests for `src/hooks/useProvider.ts`
- [ ] 1.2.9 Add unit tests for `src/hooks/useModal.ts`
- [ ] 1.2.10 Add unit tests for `src/middleware.tsx` (mergeConfigs, middleware logic)

### 1.3 Storybook
- [ ] 1.3.1 Add stories for `src/components/theme/` components (SwitchDark, SwitchColorblind)
- [ ] 1.3.2 Add stories for `src/components/markdown/` components
- [ ] 1.3.3 Add stories for `src/components/data-table/` components
- [ ] 1.3.4 Add stories for `src/components/dropzone/` components
- [ ] 1.3.5 Add stories for `src/components/settings/` components
- [ ] 1.3.6 Add stories for key `src/components/ui/` primitives (buttons, dialogs, inputs)
- [ ] 1.3.7 Register `@storybook/addon-a11y` and `@storybook/addon-coverage` in `.storybook/main.js` (installed but not registered)
- [ ] 1.3.8 Ensure Tailwind is properly loaded in `.storybook/preview.tsx`
- [ ] 1.3.9 Fix `.storybook/main.js:23` — use `path.resolve(__dirname, '../src')` instead of relative `path.resolve('../src')`

### 1.4 Type Safety
- [ ] 1.4.1 Replace `any` in `src/lib/objects.ts` (lines 1, 6) with generic type parameters
- [ ] 1.4.2 Replace `any` in `src/components/assert/assert.ts` (line 7) with proper dependency types
- [ ] 1.4.3 Replace `any` in `src/components/markdown/Preprocessor.ts` (line 9) with rule interface
- [ ] 1.4.4 Replace `any` in `src/components/markdown/MarkdownBlock.tsx` (line 12) — `{ content, role, createdAt }: any`
- [ ] 1.4.5 Type provider sidebar column definitions — 18+ `any` types in `src/app/provider/[id]/providers.tsx` (lines 33-157)
- [ ] 1.4.6 Type `NavMain.tsx` icon properties (lines 28, 34) — currently `any`
- [ ] 1.4.7 Remove 14 unsafe `as` casts across hooks, middleware, and auth utils
- [ ] 1.4.8 Remove `@ts-expect-error` in `DataTableFilter.tsx:69`
- [ ] 1.4.9 Type API route parameters: `src/app/api/alive/route.ts:3`, `src/app/api/audio/route.ts:2`

### 1.5 Code Quality
- [ ] 1.5.1 Enable `no-console` ESLint rule (currently `"off"` — contradicts CLAUDE.md)
- [ ] 1.5.2 Enable `prefer-template` ESLint rule (CLAUDE.md mandates template literals)
- [ ] 1.5.3 Enable `@typescript-eslint/no-magic-numbers` (currently `"off"`)
- [ ] 1.5.4 Enable `@typescript-eslint/no-floating-promises` for unhandled promise detection
- [ ] 1.5.5 Add `eslint-comments/no-unlimited-disable` to prevent blanket `eslint-disable` suppressions
- [ ] 1.5.6 Remove `console.log` from `next.config.js:176` and `src/app/user/[[...slug]]/page.tsx:9`
- [ ] 1.5.7 Remove commented-out code in `src/app/layout.tsx` (inter font, ThemeSetter), `src/app/[...slug]/page.tsx:6`, `src/app/down/page.tsx:12`, `src/app/docs/getting-started/page.tsx:22-34`, `src/app/docs/support/page.tsx:107-115`
- [ ] 1.5.8 Remove commented-out code in `src/app/provider/[id]/providers.tsx:262-263`
- [ ] 1.5.9 Remove commented-out code in `src/components/markdown/Link.tsx:5-6,49-65,74`, `Preprocessor.ts:35`, `CodeBlock.tsx:38,51-53`
- [ ] 1.5.10 Remove commented-out code in `DataTableColumns.tsx:62-83`, `DataTableExport.tsx:38,51-53`
- [ ] 1.5.11 Remove unused variables: `redirect` import in `src/app/page.tsx:6`, unused `setLink`/`setNotifications` state setters in `down/page.tsx` and `notifications/page.tsx`, `hasStarted` in `getting-started/page.tsx`
- [ ] 1.5.12 Deduplicate `mergeConfigs` (defined in both `src/middleware.tsx` and `next.config.js`)
- [ ] 1.5.13 Deduplicate `SwitchDark.tsx` vs `SwitchColorblind.tsx` (identical toggle logic, only strings differ)
- [ ] 1.5.14 Deduplicate `useAppearance.tsx` vs `useTheme.tsx` (nearly identical cookie persistence logic)
- [ ] 1.5.15 Centralize `getCookie('jwt')` calls (repeated 10+ times in provider pages) into a shared auth utility
- [ ] 1.5.16 Centralize `process.env.NEXT_PUBLIC_API_URI` URL templates into a shared API client
- [ ] 1.5.17 Deduplicate DataTable column definitions in `providers.tsx` (settings vs usage are nearly identical)
- [ ] 1.5.18 Deduplicate three nearly identical Dialog components in `providerSideBar.tsx:390-446`
- [ ] 1.5.19 Handle unhandled promises in event handlers (`providers.tsx:193`, `providerSideBar.tsx:159`)
- [ ] 1.5.20 Fix `useEffect` issues: `getCookie` call as dependency in `down/page.tsx:11-13` and `getting-started/page.tsx:11-15` (function call, not reactive value)
- [ ] 1.5.21 Extract magic numbers: `1000*60*5`, `1000*60*60`, `1000*60*60*24` in `notifications/page.tsx`, `24*60*60*1000` in `getting-started/page.tsx`, sidebar dimensions in `sidebar.tsx`, page sizes `[10,20,30,40,50]` in `DataTablePagination.tsx:34`
- [ ] 1.5.22 Memoize GraphQL client creation in `useProvider.ts:17` (currently recreated every render)
- [ ] 1.5.23 Fix `useToast.ts:56` — `toastTimeouts` map could grow unbounded
- [ ] 1.5.24 Remove TODO comment without linked issue in `src/app/docs/support/page.tsx:106`

### 1.6 Naming & Merge Safety
- [ ] 1.6.1 **CRITICAL:** Rename `TeamLayout` → `ProviderLayout` in `src/app/provider/layout.tsx:6` and `src/app/provider/[id]/layout.tsx:6`
- [ ] 1.6.2 **CRITICAL:** Rename `TeamPage` → `ProviderPage` in `src/app/provider/page.tsx` and `src/app/provider/[id]/page.tsx`
- [ ] 1.6.3 Fix typo in `tsconfig.json` include: `Severtities.tsx` → `Severities.tsx`
- [ ] 1.6.4 Remove stale `next.config.js.old` reference from `tsconfig.json` includes

### 1.7 Accessibility
- [ ] 1.7.1 Add `aria-label` on icon-only buttons in `NavMain.tsx` (lines 71, 80, 130)
- [ ] 1.7.2 Add `aria-sort` attribute on sortable column headers in `DataTableColumnHeader.tsx:36`
- [ ] 1.7.3 Fix `Accordion.tsx:96-104` — missing `aria-controls` and `aria-labelledby`
- [ ] 1.7.4 Fix `Disclosure.tsx:94-98` — tabIndex not properly managed; validate `Children.toArray` access (lines 79-80)
- [ ] 1.7.5 Add keyboard accessibility to `CodeBlock.tsx:197-203` — button tabs lack proper ARIA roles
- [ ] 1.7.6 Add null checks for DOM queries in `CodeBlock.tsx:164,172`

### 1.8 Infrastructure
- [ ] 1.8.1 **HIGH:** Dockerfile runs as root — add non-root user (`addgroup/adduser`, `USER nextjs`)
- [ ] 1.8.2 Dockerfile: remove build tools (`python3`, `make`, `g++`, `linux-headers`) from runner stage (lines 45-52)
- [ ] 1.8.3 Dockerfile: pin Node.js to specific patch version (currently `node:25-alpine`)
- [ ] 1.8.4 Dockerfile: add `HEALTHCHECK` instruction
- [ ] 1.8.5 `.dockerignore`: add `.env`, `.env.local`, `.next`, `.storybook`, `storybook-static`
- [ ] 1.8.6 Fix `package.json:8` typo: `rimraf ./node_nodules` → `rimraf ./node_modules`; change `&` to `&&`
- [ ] 1.8.7 `env.sh` writes to `/app/.env.local` (absolute path) — should use working directory; also unsafe if `$value` contains quotes
- [ ] 1.8.8 `tailwind.config.js`: expand content paths to include `src/` prefix and `.storybook/` directory
- [ ] 1.8.9 Add `darkMode: 'class'` to `tailwind.config.js` (project uses class-based dark mode but config doesn't declare it)
- [ ] 1.8.10 Add pre-commit hook (husky) to run `prettier --check` before commits

### 1.9 CI/CD
- [ ] 1.9.1 Uncomment or re-implement TypeScript test workflow in `.github/workflows/on-pr-main.yml:29-40`
- [ ] 1.9.2 Add container security scanning (Trivy) to `.github/workflows/on-publish-push-notable.yml`
- [ ] 1.9.3 Add secrets validation step in CI workflows
- [ ] 1.9.4 Consider changing Dependabot interval from daily to weekly (`.github/dependabot.yml:7`)

---

## 2. appwrapper (`src/components/appwrapper`)

### 2.1 Testing
- [ ] 2.1.1 Add unit tests for `AppWrapper.tsx` (rendering, mobile breakpoint behavior)
- [ ] 2.1.2 Add unit tests for `SidebarContentManager.tsx` (context provider logic)
- [ ] 2.1.3 Add unit tests for `hooks/useMobile.tsx`
- [ ] 2.1.4 Add unit tests for `ThemeSetter.tsx`
- [ ] 2.1.5 Add unit tests for `UserMenu.tsx`

### 2.2 Storybook
- [ ] 2.2.1 Add stories for `AppWrapper.tsx` (full wrapper rendering)
- [ ] 2.2.2 Add stories for `Header.tsx` / `Footer.tsx`
- [ ] 2.2.3 Add stories for `MobileSideBar.tsx`
- [ ] 2.2.4 Add stories for `UserMenu.tsx` (themes/appearances)
- [ ] 2.2.5 Add stories for `Notifications/` components
- [ ] 2.2.6 Add stories for `SidebarMain.tsx` / `SidebarPage.tsx`
- [ ] 2.2.7 Expand existing `Nav.stories.tsx` with interaction tests

### 2.3 Type Safety
- [ ] 2.3.1 Enable `strict: true` and `strictNullChecks: true` in tsconfig.json (currently false with TODOs)
- [ ] 2.3.2 Replace `any` types: `AppWrapper.tsx:13-14` (swr, menu), `AppWrapperDrawer.tsx:20` (menu)
- [ ] 2.3.3 Remove 12 unsafe `as unknown as Menu` double-casts in `AppWrapper.tsx`
- [ ] 2.3.4 Type the `Wrapper.tsx` empty props interface properly
- [ ] 2.3.5 Export prop types (`FooterProps`, `HeaderProps`, `WrapperProps`) for consumers

### 2.4 Code Quality
- [ ] 2.4.1 **CRITICAL:** Fix SSR crash: `AppWrapperHeaderFooter.tsx:14` — `window.innerWidth` accessed directly in component body (not in useEffect); will throw "window is not defined" during server-side rendering
- [ ] 2.4.2 **HIGH:** Fix Tailwind dynamic class generation — `h-[${height}]` in `AppWrapperHeaderFooter.tsx:29,58`, `border-${side}` in `AppWrapperDrawer.tsx:44`, `pl-${item.indent + 4}` in `AppWrapperList.tsx:59` — Tailwind cannot purge dynamic class names
- [ ] 2.4.3 Fix memory leak: `ThemeSetter.tsx:8` — matchMedia listener never removed
- [ ] 2.4.4 Consolidate inconsistent mobile breakpoints (600 in AppWrapper/Drawer/HeaderFooter vs 768 in useMobile)
- [ ] 2.4.5 Deduplicate `userInitials` function (defined in both `NavUser.tsx` and `UserMenu.tsx`)
- [ ] 2.4.6 Remove dead code: commented-out `MenuSWR` in `AppWrapperDrawer.tsx:63`, commented-out `NotificationsNavItem` in `SidebarMain.tsx:38`, unused `swr` parameter in `AppWrapperDrawer.tsx:11,21`
- [ ] 2.4.7 Extract magic numbers (600, 1200 zIndex, sidebar dimensions `'16rem'`/`'18rem'`/`'3rem'`/`256`, notification count `3`)
- [ ] 2.4.8 Fix hardcoded `"Context Sidebar"` string in `SidebarContentManager.tsx:16,39,47` — should be configurable
- [ ] 2.4.9 Make `visibleOnPaths` array in `SidebarContext.tsx:16` configurable (hardcoded paths hurt downstream merge safety)
- [ ] 2.4.10 Add error boundaries for `SidebarContentManager.tsx:28,58` — `useSidebarContent`/`useSetSidebarContent` throw if used outside provider context

### 2.5 Accessibility
- [ ] 2.5.1 `AppWrapperButton.tsx:18-26` — clickable div with onClick not keyboard-accessible (no tabIndex, no key handlers)
- [ ] 2.5.2 `AppWrapperDrawer.tsx:40` — overlay div with onClick needs keyboard support (Escape key to close)
- [ ] 2.5.3 `Notifications/index.tsx:14-17` — Card with onClick should be a button or have proper ARIA role

### 2.6 Self-Containment
- [ ] 2.6.1 Audit and eliminate cross-linking: imports from `@/components/ui/*`, `@/components/theme/*`, `@/auth/*`, `@/app/*`, `@/lib/utils`
- [ ] 2.6.2 Fix broken relative imports in `SidebarPage.tsx` (`../../ui/sidebar`)
- [ ] 2.6.3 Ensure the module can function via `npm link` without parent framework context

---

## 3. auth (`src/components/auth`)

### 3.1 Security
- [ ] 3.1.1 **CRITICAL:** `Login.tsx:65` — JWT set via `document.cookie` without `HttpOnly`, `Secure`, or `SameSite` flags; vulnerable to XSS theft
- [ ] 3.1.2 **CRITICAL:** `auth.middleware.ts` `generateCookieString()` — missing `HttpOnly` and `Secure` flags on cookies
- [ ] 3.1.3 **CRITICAL:** `Logout.tsx:17` — `router.replace(redirectTo)` accepts arbitrary redirect without validation; open redirect vulnerability
- [ ] 3.1.4 **CRITICAL:** `management/Team.tsx:36` — `encryption_key` field in Team type is sent to the client; encryption keys must never reach the browser
- [ ] 3.1.5 **HIGH:** `oauth2/Close.tsx`, `management/ConnectedServices.tsx:184` — JWT passed as OAuth `state` parameter, exposing it in URL/browser history/server logs
- [ ] 3.1.6 **HIGH:** `Subscribe.tsx:47` — external Stripe script loaded without `integrity` attribute (Subresource Integrity)
- [ ] 3.1.7 **HIGH:** Sensitive data logged to console: JWT tokens, email addresses, and OAuth responses in Router.tsx, auth.middleware.ts, ConnectedServices.tsx, Team.tsx
- [ ] 3.1.8 Add CSRF token validation on Login and Register forms
- [ ] 3.1.9 Add password strength validation in `Register.tsx`
- [ ] 3.1.10 Add rate limiting/debouncing on login form submission and MFA verification attempts
- [ ] 3.1.11 Validate redirect destinations against a whitelist (currently arbitrary URLs accepted)
- [ ] 3.1.12 Hardcoded role IDs in `management/Invite.tsx:24-26` (`FFFFFFFF-0000-0000-AAAA-FFFFFFFFFFFF`) — should fetch from API or config

### 3.2 Testing
- [ ] 3.2.1 Add unit tests for `auth.middleware.ts` (cookie handling, redirect logic, token validation)
- [ ] 3.2.2 Add unit tests for `utils.ts` (getQueryParams, response handling)
- [ ] 3.2.3 Add unit tests for `hooks/useUser.ts`, `hooks/useTeam.ts`, `hooks/useLoggedIn.ts`
- [ ] 3.2.4 Add unit tests for `hooks/lib.ts` (chainMutations)
- [ ] 3.2.5 Add unit tests for `gravatar.ts`
- [ ] 3.2.6 Add unit tests for MFA components (Authenticator, EMail, SMS)
- [ ] 3.2.7 Add unit tests for management components (Account, Profile, Team, Invitations)

### 3.3 Storybook
- [ ] 3.3.1 Add stories for `Login.tsx`, `Register.tsx`, `Logout.tsx`
- [ ] 3.3.2 Add stories for `Router.tsx` (various auth states)
- [ ] 3.3.3 Add stories for `Identify.tsx`, `OU.tsx`
- [ ] 3.3.4 Add stories for `management/` components (Account, Profile, Team, Invitations, ConnectedServices)
- [ ] 3.3.5 Add stories for `mfa/` components (Authenticator, EMail, SMS)
- [ ] 3.3.6 Add stories for `oauth2/` components
- [ ] 3.3.7 Expand existing `AuthCard.stories.tsx` with interaction tests

### 3.4 Type Safety
- [ ] 3.4.1 Enable `strict: true` and `strictNullChecks: true` in tsconfig.json
- [ ] 3.4.2 Eliminate 39 `any` types across Router, Login, Subscribe, OU, middleware, hooks, management, MFA, and OAuth components
- [ ] 3.4.3 Fix `@ts-expect-error` suppressions in `auth.middleware.ts` (lines 103-107, 171-172)
- [ ] 3.4.4 Type `searchParams` properly in Router.tsx, Login.tsx, Subscribe.tsx (currently `any`)
- [ ] 3.4.5 Type hook return values: `useProducts`, `useTeam`, `useTeamUsers`
- [ ] 3.4.6 Create proper interfaces for management component props (Profile, Team, Gravatar)
- [ ] 3.4.7 Export interfaces: `ConnectedService` from `ConnectedServices.tsx`, role type from `Invite.tsx`, User type from `Team.tsx`

### 3.5 Code Quality
- [ ] 3.5.1 Remove 49 `console.log` statements (Router: 5, middleware: 29, utils: 5, ConnectedServices: 6, hooks: 4)
- [ ] 3.5.2 Extract cookie expiration magic number `86400` (appears 8+ times) to named constant
- [ ] 3.5.3 Extract magic numbers: `2000` (Login timeout), `256` (QR size), `40` (Gravatar size), `10` (email invite limit in `Invite.tsx:117`)
- [ ] 3.5.4 Remove dead code: commented-out section in `management/index.tsx:92-139`, commented-out useEffect in `Register.tsx:100-112`, unused `getSearchParamsAsync` in `utils.ts:106-120`, `management/Gravatar.tsx:6` comment "This component should be deleted"
- [ ] 3.5.5 Fix unhandled promises in `auth.middleware.ts:49-58`, `ConnectedServices.tsx` (lines 92, 110, 127)
- [ ] 3.5.6 Fix useEffect issues: unstable `router` dependency in `useLoggedIn.ts:31`, empty useEffect in `Register.tsx:88-90`, missing deps in `ConnectedServices.tsx:81-83`
- [ ] 3.5.7 Add null checks for unsafe accesses (`auth.middleware.ts:69`, `ConnectedServices.tsx:101`)
- [ ] 3.5.8 Deduplicate cookie generation code and GraphQL client creation across hooks
- [ ] 3.5.9 Create missing `src/index.ts` entry point (package.json references it but it doesn't exist)
- [ ] 3.5.10 Fix empty else block in `Register.tsx:86` — silent failure on non-200/201 status
- [ ] 3.5.11 Add error handling in `mfa/EMail.tsx:25-58` — API call not wrapped in try-catch

### 3.6 Accessibility
- [ ] 3.6.1 Fix `Identify.tsx:97` — `htmlFor='E-Mail Address'` should be an element ID, not descriptive text
- [ ] 3.6.2 Add `aria-invalid` and `aria-describedby` on form inputs when errors present
- [ ] 3.6.3 Add `autocomplete="current-password"` on Login password field
- [ ] 3.6.4 Add `aria-describedby` linking password and password-confirmation fields in `Register.tsx`
- [ ] 3.6.5 Add aria guidance on MFA code input explaining "enter 6-digit code" (`Login.tsx:132-139`)
- [ ] 3.6.6 Add loading/disabled state on buttons during async operations (Login, Register, MFA verify, Invite send, ConnectedServices OAuth)

### 3.7 Race Conditions
- [ ] 3.7.1 `management/Profile.tsx:94-128` — multiple timezone update API calls can race; add debouncing or cancellation
- [ ] 3.7.2 `management/Team.tsx:74-99` — `fetchData` called multiple times without debouncing
- [ ] 3.7.3 `auth.middleware.ts:62-108` — multiple invitations processed simultaneously could create duplicate cookies/redirects

### 3.8 Self-Containment
- [ ] 3.8.1 Audit and eliminate cross-linking: imports from `@/components/ui/*`, `@/components/assert/*`, `@/components/wais/*`, `@/components/dynamic-form/*`, `@/lib/*`, `@/next-log/*`, `@/zod2gql`, `@/hooks/*`
- [ ] 3.8.2 Ensure the module can function via `npm link` without parent framework context

---

## 4. dynamic-form (`src/components/dynamic-form`)

### 4.1 Testing
- [ ] 4.1.1 Add unit tests for `DynamicForm.tsx` (form rendering, field state management, submission)
- [ ] 4.1.2 Add unit tests for `Field.tsx` (field type routing)
- [ ] 4.1.3 Add unit tests for `SelectField.tsx` (selection handling, items rendering)
- [ ] 4.1.4 Add unit tests for `CheckField.tsx` (boolean toggle)
- [ ] 4.1.5 Add unit tests for `RadioField.tsx` (radio group behavior)
- [ ] 4.1.6 Add unit tests for `PasswordField.tsx`
- [ ] 4.1.7 Add unit tests for `TextField.tsx`
- [ ] 4.1.8 Test edge cases: empty fields array, null values, special characters in field names

### 4.2 Storybook
- [ ] 4.2.1 Add stories for `DynamicForm.tsx` (full form with multiple field types)
- [ ] 4.2.2 Add stories for `SelectField.tsx`
- [ ] 4.2.3 Add stories for `CheckField.tsx`
- [ ] 4.2.4 Add stories for `RadioField.tsx`
- [ ] 4.2.5 Add stories for `PasswordField.tsx`
- [ ] 4.2.6 Add interaction tests to existing `TextField.stories.tsx`

### 4.3 Type Safety
- [ ] 4.3.1 Enable `strict: true` and `strictNullChecks: true` in tsconfig.json
- [ ] 4.3.2 Eliminate 13 `any` types: SelectField items/value, Field onChange, DynamicForm toUpdate/handleChange, RadioField items/value, story args
- [ ] 4.3.3 Type `SelectField.items` and `RadioField.items` as `Array<{value: string; label: string}>`
- [ ] 4.3.4 Add type guard for error object in `DynamicForm.tsx:114`
- [ ] 4.3.5 Fix empty `index.ts` — actually export DynamicForm and all field components
- [ ] 4.3.6 Fix export path mismatch: package.json expects `dist/Form/DynamicForm.js` but source is `src/DynamicForm.tsx`

### 4.4 Code Quality
- [ ] 4.4.1 **HIGH:** Fix `Field.tsx:65` — `value?.toLowerCase()` called on a value that could be boolean; will throw at runtime
- [ ] 4.4.2 **HIGH:** Fix form submission race condition in `DynamicForm.tsx:90-124` — state updates are batched but `onConfirm` fires before they apply
- [ ] 4.4.3 Extract repeated `clsx()` grid class conditionals in `DynamicForm.tsx:151-183` into a helper
- [ ] 4.4.4 Deduplicate `setEditedState` pattern at lines 96 and 110 in `DynamicForm.tsx`
- [ ] 4.4.5 Add proper event typing for `handleChange` (line 86)
- [ ] 4.4.6 Add loading/disabled state on submit button during form submission
- [ ] 4.4.7 Sanitize field name to valid HTML ID in `DynamicForm.tsx:149` (currently only replaces spaces, not `!@#$%` etc.)
- [ ] 4.4.8 Make hardcoded error messages configurable (`DynamicForm.tsx:100,107`) for i18n

### 4.5 Accessibility
- [ ] 4.5.1 **HIGH:** Add `aria-live="polite"` or `role="alert"` on error message containers in `Field.tsx:83-103`
- [ ] 4.5.2 **HIGH:** Add `aria-invalid="true"` on inputs when error is present (`TextField.tsx:25-30`)
- [ ] 4.5.3 **HIGH:** Add `aria-describedby` linking inputs to their error messages
- [ ] 4.5.4 Add accessible label for RadioField when used outside of Field wrapper
- [ ] 4.5.5 Add `<fieldset>` and `<legend>` for grouped form fields in `DynamicForm.tsx`

### 4.6 Self-Containment
- [ ] 4.6.1 Audit and eliminate cross-linking: imports from `@/components/ui/*`, `@/lib/utils`, `@/next-log/log`
- [ ] 4.6.2 Ensure the module can function via `npm link` without parent framework context

---

## 5. next-log (`src/lib/next-log`)

### 5.1 Testing
- [ ] 5.1.1 Add unit tests for `log.ts` (server vs client branch, verbosity levels, heading formatting)
- [ ] 5.1.2 Test edge cases: empty logItems, missing verbosity config, undefined heading

### 5.2 Storybook
- [ ] 5.2.1 Add stories demonstrating log output at different verbosity levels (if applicable to UI)

### 5.3 Type Safety
- [ ] 5.3.1 Enable `strict: true` and `strictNullChecks: true` in tsconfig.json
- [ ] 5.3.2 Replace `any[]` for `logItems` parameter in `log.ts:2` with generic or `unknown[]`
- [ ] 5.3.3 Fix bug: `log.ts:13` references undefined variable `logItem` (should be `logItems`)
- [ ] 5.3.4 Fix `any` types in `.storybook/preview.tsx` (Story, context parameters)

### 5.4 Code Quality
- [ ] 5.4.1 Deduplicate server/client logging branches in `log.ts` (lines 16-26 vs 28-38 — nearly identical)
- [ ] 5.4.2 Extract magic number `8` (heading padding) in `log.ts:24,35` to named constant
- [ ] 5.4.3 Fix storybook preview: imports from non-existent paths (ThemeWrapper, ReferenceGrid, ComparisonGrid, globals.css)
- [ ] 5.4.4 Fix empty `index.ts` — actually export the log function
- [ ] 5.4.5 Clean up package.json: 89 export paths declared but source only contains a log function
- [ ] 5.4.6 Prune production dependencies: 40+ packages (React, MUI, Radix, etc.) for a 40-line logging function

### 5.5 Self-Containment
- [ ] 5.5.1 Remove storybook cross-references to non-existent Theming/Storybook modules
- [ ] 5.5.2 Ensure the module can function via `npm link` without parent framework context

---

## 6. zod2gql (`src/lib/zod2gql`)

### 6.1 Testing
- [ ] 6.1.1 Add unit tests for `processFields()` (scalar types, nested objects, arrays, optionals)
- [ ] 6.1.2 Add unit tests for `formatVariablesDeclaration()` (type inference accuracy)
- [ ] 6.1.3 Add unit tests for `processQuery()`, `processMutation()`, `processSubscription()`
- [ ] 6.1.4 Add unit tests for `pluralize()` (edge cases: empty string, irregular plurals)
- [ ] 6.1.5 Add unit tests for `getOperationFieldName()` (name derivation from schemas)
- [ ] 6.1.6 Add unit tests for `z.ZodObject.prototype.toGQL()` and `z.ZodArray.prototype.toGQL()`
- [ ] 6.1.7 Test edge cases: empty schemas, maxDepth exceeded, circular references via `z.lazy()`
- [ ] 6.1.8 Test error conditions: invalid schema types, unsupported Zod features
- [ ] 6.1.9 Test GraphQL reserved words as field names
- [ ] 6.1.10 Test special characters and numeric-prefixed field names

### 6.2 Storybook
- [ ] 6.2.1 Add interaction test assertions to the 35+ existing stories that lack `play` functions
- [ ] 6.2.2 Add stories for error/edge cases (empty schemas, deep nesting, circular refs)

### 6.3 Type Safety
- [ ] 6.3.1 Eliminate 25 `any` types across index.ts, mutation.ts, and story files
- [ ] 6.3.2 Replace `(schema as any)._def.typeName` (line 73) with proper Zod type discrimination
- [ ] 6.3.3 Type `inferType` function (`index.ts:101`) — accept `unknown` instead of `any`
- [ ] 6.3.4 Type `variables` parameter as `Record<string, unknown>` instead of `Record<string, any>`
- [ ] 6.3.5 **BUG:** Fix inverted nullability — Zod `optional()` fields incorrectly generate required (`!`) GraphQL fields
- [ ] 6.3.6 Add support for `z.enum()` → GraphQL enum types (currently renders as scalar)
- [ ] 6.3.7 Add support for `z.union()` / `z.discriminatedUnion()` → GraphQL union types
- [ ] 6.3.8 Handle `z.literal()`, `z.default()`, `z.transform()` appropriately
- [ ] 6.3.9 Handle missing Zod types: `z.date`, `z.bigint`, `z.map`, `z.set`, `z.tuple`, `z.intersection`, `z.promise`, `z.preprocess`, `z.pipeline`, `z.branded`, `z.catch`, `z.readonly`
- [ ] 6.3.10 Unwrap `z.nan`, `z.void`, `z.undefined`, `z.never` gracefully (skip or error, don't silently produce invalid output)

### 6.4 Code Quality
- [ ] 6.4.1 Remove `console.log` in `query.ts:18`
- [ ] 6.4.2 **HIGH:** Validate field names against GraphQL reserved words (`query`, `mutation`, `subscription`, `type`, `interface`, `enum`, `scalar`) and invalid characters (hyphens, spaces, leading digits)
- [ ] 6.4.3 **HIGH:** `maxDepth` silently drops nested fields (`index.ts:143-145`) — should warn or error instead of producing silently incomplete queries
- [ ] 6.4.4 Deduplicate `processArrayQuery/Mutation/Subscription` — extract shared logic into factory function
- [ ] 6.4.5 Deduplicate type inference logic between `index.ts:101-117` and `mutation.ts:23-32`
- [ ] 6.4.6 Extract starting indent depth `2` (lines 210, 232, 254) to named constant
- [ ] 6.4.7 Move `react` and `next` from dependencies to devDependencies (only needed for Storybook)
- [ ] 6.4.8 Consider replacing prototype extension (`z.ZodObject.prototype.toGQL`) with wrapper function to avoid conflicts with other libraries
- [ ] 6.4.9 Add cycle detection for circular references beyond the `maxDepth` safeguard
- [ ] 6.4.10 Fix potential object type name collisions in variable inference (e.g., `userData` and `userdata` both become `UserDataInput`)
- [ ] 6.4.11 Export `ToGQLOptions` interface and `GQLType` enum explicitly for consumers
