#!/bin/sh
# Build Storybook and run Playwright integration tests against the static build.
# Adapted from JamesonRGrieve/wh40k-ttrpg-foundry-vtt:scripts/run-storybook-playwright-tests.sh.
set -eu

pnpm exec storybook build
pnpm exec playwright test -c playwright.storybook.config.ts
