const test = require('node:test');
const assert = require('node:assert');
const { buildNotification } = require('./notify');

test('Notification event → needs-input body, project basename title', () => {
  const result = buildNotification({
    hook_event_name: 'Notification',
    cwd: '/Users/me/code/my-app',
  });
  assert.strictEqual(result.title, 'my-app');
  assert.strictEqual(result.message, 'Claude needs input');
});

test('Stop event → finished body, project basename title', () => {
  const result = buildNotification({
    hook_event_name: 'Stop',
    cwd: '/Users/me/code/my-app',
  });
  assert.strictEqual(result.title, 'my-app');
  assert.strictEqual(result.message, 'Claude finished');
});

test('missing cwd → title falls back to "Claude Code"', () => {
  const result = buildNotification({ hook_event_name: 'Stop' });
  assert.strictEqual(result.title, 'Claude Code');
  assert.strictEqual(result.message, 'Claude finished');
});

test('empty string cwd → title falls back to "Claude Code"', () => {
  const result = buildNotification({ hook_event_name: 'Stop', cwd: '' });
  assert.strictEqual(result.title, 'Claude Code');
  assert.strictEqual(result.message, 'Claude finished');
});

test('unknown event name → defaults to finished body', () => {
  const result = buildNotification({
    hook_event_name: 'SomethingElse',
    cwd: '/tmp/proj',
  });
  assert.strictEqual(result.message, 'Claude finished');
  assert.strictEqual(result.title, 'proj');
});

test('empty payload → fallback title, finished body', () => {
  const result = buildNotification({});
  assert.strictEqual(result.title, 'Claude Code');
  assert.strictEqual(result.message, 'Claude finished');
});
