const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginRoot = path.resolve(__dirname, '..');
const pkgPath = path.join(pluginRoot, 'package.json');
const nodeModulesPath = path.join(pluginRoot, 'node_modules');

function needsInstall() {
  if (!fs.existsSync(nodeModulesPath)) return true;
  try {
    const pkgMtime = fs.statSync(pkgPath).mtimeMs;
    const modulesMtime = fs.statSync(nodeModulesPath).mtimeMs;
    return pkgMtime > modulesMtime;
  } catch {
    return true;
  }
}

try {
  if (needsInstall()) {
    execSync('npm install --silent --no-audit --no-fund', {
      cwd: pluginRoot,
      stdio: 'ignore',
    });
  }
} catch (err) {
  process.stderr.write(`claude-code-notifier ensure-deps: ${err.message}\n`);
}

process.exit(0);
