const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEFAULT_CONFIG, mergeConfig, readConfig } = require('./config');

function withTempConfigHome(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccn-cfg-'));
  const prev = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = dir;
  try {
    return fn(dir);
  } finally {
    if (prev === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = prev;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('mergeConfig: null → defaults', () => {
  assert.deepStrictEqual(mergeConfig(null), DEFAULT_CONFIG);
});

test('mergeConfig: empty object → defaults', () => {
  assert.deepStrictEqual(mergeConfig({}), DEFAULT_CONFIG);
});

test('mergeConfig: overrides sound only', () => {
  const result = mergeConfig({ sound: 'Glass' });
  assert.strictEqual(result.sound, 'Glass');
  assert.strictEqual(result.events.Stop, true);
  assert.strictEqual(result.events.Notification, true);
});

test('mergeConfig: sound false → silent', () => {
  const result = mergeConfig({ sound: false });
  assert.strictEqual(result.sound, false);
});

test('mergeConfig: events.Stop false → disabled', () => {
  const result = mergeConfig({ events: { Stop: false } });
  assert.strictEqual(result.events.Stop, false);
  assert.strictEqual(result.events.Notification, true);
});

test('mergeConfig: partial events object → fills defaults for missing keys', () => {
  const result = mergeConfig({ events: { Notification: false } });
  assert.strictEqual(result.events.Stop, true);
  assert.strictEqual(result.events.Notification, false);
});

test('mergeConfig: invalid events field → ignored, defaults used', () => {
  const result = mergeConfig({ events: 'not an object' });
  assert.deepStrictEqual(result.events, DEFAULT_CONFIG.events);
});

test('readConfig: missing file → defaults, no error callback', () => {
  withTempConfigHome(() => {
    const errors = [];
    const cfg = readConfig((msg) => errors.push(msg));
    assert.deepStrictEqual(cfg, DEFAULT_CONFIG);
    assert.deepStrictEqual(errors, []);
  });
});

test('readConfig: valid JSON file → parsed, no error callback', () => {
  withTempConfigHome((dir) => {
    const d = path.join(dir, 'claude-code-notifier');
    fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, 'config.json'), JSON.stringify({ sound: 'Glass' }));
    const errors = [];
    const cfg = readConfig((msg) => errors.push(msg));
    assert.strictEqual(cfg.sound, 'Glass');
    assert.deepStrictEqual(errors, []);
  });
});

test('readConfig: malformed JSON → defaults + error callback fired', () => {
  withTempConfigHome((dir) => {
    const d = path.join(dir, 'claude-code-notifier');
    fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, 'config.json'), '{ broken json');
    const errors = [];
    const cfg = readConfig((msg) => errors.push(msg));
    assert.deepStrictEqual(cfg, DEFAULT_CONFIG);
    assert.strictEqual(errors.length, 1);
    assert.match(errors[0], /invalid JSON/);
  });
});
