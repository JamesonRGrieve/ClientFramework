// SPDX-License-Identifier: AGPL-3.0-or-later
// Storybook builds this package's styles through PostCSS, so Tailwind runs here too.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
