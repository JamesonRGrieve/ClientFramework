FROM node:23-alpine AS builder
WORKDIR /client-build

# Install build dependencies for native modules (sharp, usb, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    eudev-dev \
    libusb-dev \
    linux-headers \
    eudev-libs

# Configure npm for better timeout handling in Podman
# Increased timeouts and retries for unreliable networks
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set maxsockets 5

COPY package*.json ./
RUN npm install -g npm@latest

# npm ci will automatically install optionalDependencies based on architecture
# No need to manually install lightningcss/tailwindcss packages
# Split into chunks to reduce memory pressure and allow partial recovery
RUN npm ci --prefer-offline --no-audit --ignore-scripts || \
    (npm cache clean --force && npm ci --prefer-offline --no-audit --ignore-scripts)
RUN npm rebuild || true

COPY . .
ARG API_URI
ARG SERVERSIDE_API_URI
ARG APP_NAME
ARG APP_URI
RUN chmod +x ./env.sh && ./env.sh
RUN npm run build

FROM node:23-alpine AS runner
WORKDIR /client
ENV NODE_ENV=production

# Runtime dependencies for native modules
RUN apk add --no-cache \
    python3 \
    libusb \
    eudev \
    make \
    g++ \
    linux-headers \
    eudev-libs

COPY package*.json ./

# Configure npm timeouts for runner stage too
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set maxsockets 5

RUN npm install -g npm@latest && \
    (npm ci --omit=dev --prefer-offline --no-audit --ignore-scripts || \
     (npm cache clean --force && npm ci --omit=dev --prefer-offline --no-audit --ignore-scripts))
RUN npm rebuild || true

COPY --from=builder /client-build/server-wrapper.js /client/
COPY --from=builder /client-build/public /client/public
COPY --from=builder /client-build/.next/standalone /client/
COPY --from=builder /client-build/.next/static /client/.next/static

EXPOSE 1109
ENV PORT=1109
ENTRYPOINT ["node", "server-wrapper.js"]
