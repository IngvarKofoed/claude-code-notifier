const path = require('path');

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

async function main() {
  try {
    const raw = await readStdin();
    const payload = raw.trim() ? JSON.parse(raw) : {};
    const { title, message } = buildNotification(payload);
    const notifier = require('node-notifier');
    notifier.notify({ title, message, sound: true });
  } catch (err) {
    process.stderr.write(`claude-code-notifier: ${err.message}\n`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildNotification };
