// SPDX-License-Identifier: AGPL-3.0-or-later
// Container entry point: load a mounted .env.local (or .env) into the environment, then start
// Next's standalone server, which reads its configuration from process.env.
const { existsSync } = require('fs');
const { config } = require('dotenv');
const path = require('path');

const ENV_FILES = ['.env.local', '.env'];
const envFile = ENV_FILES.find((name) => existsSync(path.join(process.cwd(), name)));
if (envFile !== undefined) {
  config({ path: envFile });
}

require('./server');
