const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { logPath } = require('./paths');
const { readConfig } = require('./config');

const ALLOWED_EVENTS = new Set(['Stop', 'Notification']);

function buildNotification(payload) {
  const p = payload || {};
  const cwd = typeof p.cwd === 'string' ? p.cwd : '';
  const event = p.hook_event_name;
  const title = path.basename(cwd) || 'Claude Code';
  const message = event === 'Notification' ? 'Claude needs input' : 'Claude finished';
  return { title, message };
}

function shouldFire(payload, config) {
  const p = payload || {};
  const event = p.hook_event_name;
  if (!ALLOWED_EVENTS.has(event)) return false;
  if (event === 'Notification') {
    const type = p.notification_type;
    if (type !== undefined && type !== 'permission_prompt') return false;
  }
  if (config && config.events && config.events[event] === false) return false;
  return true;
}

function appendLog(entry) {
  try {
    const p = logPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify(entry) + '\n');
  } catch {
    // swallow — logging must never break notifications
  }
}

async function readStdin() {
  let data = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}

function dispatchWorker(notification, sound) {
  const child = spawn(process.execPath, [__filename, '--worker'], {
    env: {
      ...process.env,
      NOTIFY_PAYLOAD: JSON.stringify(notification),
      NOTIFY_SOUND: JSON.stringify(sound),
    },
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function runWorker() {
  try {
    const { title, message } = JSON.parse(process.env.NOTIFY_PAYLOAD || '{}');
    const sound = JSON.parse(process.env.NOTIFY_SOUND || 'true');
    const notifier = require('node-notifier');
    notifier.notify({ title, message, sound });
  } catch (err) {
    process.stderr.write(`claude-code-notifier worker: ${err.message}\n`);
  }
}

async function main() {
  let payload = {};
  try {
    const raw = await readStdin();
    payload = raw.trim() ? JSON.parse(raw) : {};
    const config = readConfig();
    const fire = shouldFire(payload, config);
    appendLog({
      ts: new Date().toISOString(),
      pid: process.pid,
      ppid: process.ppid,
      event: payload.hook_event_name,
      notification_type: payload.notification_type,
      skipped: !fire,
      cwd: payload.cwd,
      session_id: payload.session_id,
      transcript_path: payload.transcript_path,
      stop_hook_active: payload.stop_hook_active,
      payload,
    });
    if (fire) {
      dispatchWorker(buildNotification(payload), config.sound);
    }
  } catch (err) {
    appendLog({
      ts: new Date().toISOString(),
      pid: process.pid,
      ppid: process.ppid,
      error: err.message,
    });
    process.stderr.write(`claude-code-notifier: ${err.message}\n`);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  if (process.argv.includes('--worker')) {
    runWorker();
  } else {
    main();
  }
}

module.exports = { buildNotification, shouldFire };
