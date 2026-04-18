const fs = require('fs');
const { configPath } = require('./paths');

const DEFAULT_CONFIG = {
  sound: true,
  events: {
    Stop: true,
    Notification: true,
  },
};

function mergeConfig(loaded) {
  const l = loaded && typeof loaded === 'object' ? loaded : {};
  const events = l.events && typeof l.events === 'object' ? l.events : {};
  return {
    sound: l.sound !== undefined ? l.sound : DEFAULT_CONFIG.sound,
    events: {
      Stop: events.Stop !== undefined ? !!events.Stop : DEFAULT_CONFIG.events.Stop,
      Notification: events.Notification !== undefined ? !!events.Notification : DEFAULT_CONFIG.events.Notification,
    },
  };
}

function readConfig() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    return mergeConfig(JSON.parse(raw));
  } catch {
    return mergeConfig(null);
  }
}

function writeConfig(cfg) {
  const fs = require('fs');
  const path = require('path');
  const p = configPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n');
}

module.exports = { DEFAULT_CONFIG, mergeConfig, readConfig, writeConfig };
