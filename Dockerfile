# SPDX-License-Identifier: AGPL-3.0-or-later
# The template app as a production image: build with pnpm, run Next's standalone server as an
# unprivileged user. The build needs @zephyrex/auth, @jgrieve/forms and zod2gql from the registry,
# so it works once they are published and pnpm-workspace.yaml's sibling overrides are removed.
ARG NODE_IMAGE=node:24.17.0-alpine
ARG PNPM_VERSION=11.1.1

FROM ${NODE_IMAGE} AS builder
ARG PNPM_VERSION
WORKDIR /client-build
RUN corepack enable && corepack prepare "pnpm@${PNPM_VERSION}" --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Every workspace package's manifest, so the frozen install sees the whole workspace.
COPY packages/zephyrex/package.json ./packages/zephyrex/
COPY packages/observability/package.json ./packages/observability/
COPY packages/auth-api-keys/package.json ./packages/auth-api-keys/
COPY packages/auth-session/package.json ./packages/auth-session/
RUN pnpm install --frozen-lockfile
COPY . .
# Read by next.config.js and zephyrex.config.ts at build time; nothing is written to disk or logged.
ARG API_URI
ARG APP_NAME
ARG APP_URI
# The app consumes the compiled workspace packages, so they are built first.
RUN pnpm compile && pnpm build

FROM ${NODE_IMAGE} AS runner
WORKDIR /client
ENV NODE_ENV=production
ENV PORT=1109
# The standalone output carries the traced node_modules it needs (sharp ships prebuilt musl binaries),
# so the runner installs nothing and needs no build tools.
COPY --from=builder --chown=node:node /client-build/.next/standalone ./
COPY --from=builder --chown=node:node /client-build/.next/static ./.next/static
COPY --from=builder --chown=node:node /client-build/public ./public
COPY --from=builder --chown=node:node /client-build/server-wrapper.js ./
USER node
EXPOSE 1109
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/alive" || exit 1
ENTRYPOINT ["node", "server-wrapper.js"]
