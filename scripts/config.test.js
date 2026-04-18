const test = require('node:test');
const assert = require('node:assert');
const { DEFAULT_CONFIG, mergeConfig } = require('./config');

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
