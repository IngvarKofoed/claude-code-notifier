const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const ALLOWED_EVENTS = new Set(['Stop', 'Notification']);
const LOG_PATH = path.join(os.homedir(), '.claude-code-notifier.log');

function buildNotification(payload) {
  const p = payload || {};
  const cwd = typeof p.cwd === 'string' ? p.cwd : '';
  const event = p.hook_event_name;
  const title = path.basename(cwd) || 'Claude Code';
  const message = event === 'Notification' ? 'Claude needs input' : 'Claude finished';
  return { title, message };
}

function appendLog(entry) {
  try {
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
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

function dispatchWorker(notification) {
  const child = spawn(process.execPath, [__filename, '--worker'], {
    env: { ...process.env, NOTIFY_PAYLOAD: JSON.stringify(notification) },
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function runWorker() {
  try {
    const { title, message } = JSON.parse(process.env.NOTIFY_PAYLOAD || '{}');
    const notifier = require('node-notifier');
    notifier.notify({ title, message, sound: true });
  } catch (err) {
    process.stderr.write(`claude-code-notifier worker: ${err.message}\n`);
  }
}

async function main() {
  let payload = {};
  try {
    const raw = await readStdin();
    payload = raw.trim() ? JSON.parse(raw) : {};
    const event = payload.hook_event_name;
    const allowed = ALLOWED_EVENTS.has(event);
    appendLog({
      ts: new Date().toISOString(),
      pid: process.pid,
      ppid: process.ppid,
      event,
      skipped: !allowed,
      cwd: payload.cwd,
      session_id: payload.session_id,
      transcript_path: payload.transcript_path,
      stop_hook_active: payload.stop_hook_active,
      payload,
    });
    if (allowed) {
      dispatchWorker(buildNotification(payload));
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

module.exports = { buildNotification };
