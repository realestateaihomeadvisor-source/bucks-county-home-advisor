#!/usr/bin/env node
// Offline only: no provider, CRM, notification, or browser sessions required.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const directories = ['integrations/n8n', 'integrations/voiceflow', 'tests'];
const files = directories.flatMap(dir => fs.readdirSync(path.join(root, dir))
  .filter(name => name.endsWith('.test.cjs')).map(name => path.join(dir, name))).sort();
if (!files.length) throw new Error('No regression tests found');
const result = spawnSync(process.execPath, ['--test', ...files], {
  cwd: root, stdio: 'inherit', timeout: 120000,
});
if (result.error) console.error(result.error.message);
process.exit(result.status === 0 ? 0 : 1);
