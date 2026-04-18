const path = require('path');
const { spawn } = require('child_process');

function buildNotification(payload) {
  const p = payload || {};
  const cwd = typeof p.cwd === 'string' ? p.cwd : '';
  const event = p.hook_event_name;
  const title = path.basename(cwd) || 'Claude Code';
  const message = event === 'Notification' ? 'Claude needs input' : 'Claude finished';
  return { title, message };
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
  try {
    const raw = await readStdin();
    const payload = raw.trim() ? JSON.parse(raw) : {};
    dispatchWorker(buildNotification(payload));
  } catch (err) {
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
