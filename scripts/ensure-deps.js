const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginRoot = path.resolve(__dirname, '..');
const marker = path.join(pluginRoot, 'node_modules', 'node-notifier');

try {
  if (!fs.existsSync(marker)) {
    execSync('npm install --silent --no-audit --no-fund', {
      cwd: pluginRoot,
      stdio: 'ignore',
    });
  }
} catch (err) {
  process.stderr.write(`claude-code-notifier ensure-deps: ${err.message}\n`);
}

process.exit(0);
