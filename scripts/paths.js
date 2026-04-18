const path = require('path');
const os = require('os');

const APP_NAME = 'claude-code-notifier';

function configDir() {
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(base, APP_NAME);
  }
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, APP_NAME);
}

function stateDir() {
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(base, APP_NAME);
  }
  const base = process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state');
  return path.join(base, APP_NAME);
}

function configPath() {
  return path.join(configDir(), 'config.json');
}

function logPath() {
  return path.join(stateDir(), 'notifier.log');
}

module.exports = { configDir, stateDir, configPath, logPath };
