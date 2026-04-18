# claude-code-notifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code plugin that emits native desktop notifications on `Stop` and `Notification` hook events, cross-platform (macOS/Windows/Linux), with zero configuration.

**Architecture:** A Claude Code plugin whose hooks invoke small Node.js scripts. `scripts/notify.js` reads the hook JSON from stdin, derives title/body, and calls `node-notifier`. A `SessionStart` hook calls `scripts/ensure-deps.js` to idempotently install the one dependency on first run. `notify.js` is split into a pure `buildNotification(payload)` function (easily unit-tested) and a thin stdin/notify entry point.

**Tech Stack:** Node.js (user-provided), `node-notifier` (bundles platform binaries), Node's built-in `node --test` test runner.

**Spec:** `docs/DESIGN.md`

---

## File Structure

```
claude-code-notifier/
├── .claude-plugin/
│   └── plugin.json              # plugin manifest
├── hooks/
│   └── hooks.json               # Stop + Notification + SessionStart wiring
├── scripts/
│   ├── notify.js                # exports buildNotification; entry reads stdin + notifies
│   ├── ensure-deps.js           # idempotent dep install for SessionStart
│   └── notify.test.js           # unit tests for buildNotification
├── package.json                 # node-notifier dep, test script
├── .gitignore                   # excludes node_modules
└── README.md
```

Responsibilities:
- **`.claude-plugin/plugin.json`** — plugin identity, version, description.
- **`hooks/hooks.json`** — declarative wiring of three hook events to Node commands.
- **`scripts/notify.js`** — pure `buildNotification(payload) -> {title, message}` plus a stdin/notify main block.
- **`scripts/ensure-deps.js`** — checks for `node_modules/node-notifier`, runs `npm install` if missing.
- **`scripts/notify.test.js`** — unit tests for `buildNotification` using `node --test`.
- **`package.json`** — dependency declaration, `test` script.
- **`.gitignore`** — excludes `node_modules`.
- **`README.md`** — prerequisites, install, usage.

---

### Task 1: Project scaffolding (manifest, package.json, gitignore)

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create `.gitignore`**

Create `.gitignore` with:

```
node_modules/
```

- [ ] **Step 2: Create `package.json`**

Create `package.json` with:

```json
{
  "name": "claude-code-notifier",
  "version": "0.1.0",
  "private": true,
  "description": "Cross-platform desktop notifications for Claude Code sessions.",
  "license": "MIT",
  "scripts": {
    "test": "node --test scripts/notify.test.js"
  },
  "dependencies": {
    "node-notifier": "^10.0.1"
  }
}
```

- [ ] **Step 3: Create `.claude-plugin/plugin.json`**

Create `.claude-plugin/plugin.json` with:

```json
{
  "name": "claude-code-notifier",
  "version": "0.1.0",
  "description": "Cross-platform desktop notifications on Claude Code Stop and Notification hooks.",
  "author": {
    "name": "Ingvar Kofoed"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json .claude-plugin/plugin.json
git commit -m "chore: scaffold plugin manifest and package.json"
```

---

### Task 2: Write `buildNotification` tests (red)

**Files:**
- Create: `scripts/notify.test.js`

- [ ] **Step 1: Create the test file**

Create `scripts/notify.test.js` with:

```js
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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test`

Expected: FAIL with `Cannot find module './notify'` (the module does not exist yet).

---

### Task 3: Implement `notify.js` (green)

**Files:**
- Create: `scripts/notify.js`

- [ ] **Step 1: Create `scripts/notify.js`**

Create `scripts/notify.js` with:

```js
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
```

- [ ] **Step 2: Install dependencies so tests can run**

Run: `npm install`

Expected: node-notifier installed, `node_modules/` and `package-lock.json` created.

- [ ] **Step 3: Run tests — expect pass**

Run: `npm test`

Expected: all six tests pass, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/notify.js scripts/notify.test.js package-lock.json
git commit -m "feat: add buildNotification with unit tests"
```

Note: `node_modules/` is git-ignored. `package-lock.json` is committed so the dep tree is reproducible.

---

### Task 4: Implement `ensure-deps.js`

**Files:**
- Create: `scripts/ensure-deps.js`

- [ ] **Step 1: Create `scripts/ensure-deps.js`**

Create `scripts/ensure-deps.js` with:

```js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginRoot = path.resolve(__dirname, '..');
const marker = path.join(pluginRoot, 'node_modules', 'node-notifier');

try {
  if (!fs.existsSync(marker)) {
    execSync('npm install --silent --no-audit --no-fund', {
      cwd: pluginRoot,
      stdio: 'ignore',
    });
  }
} catch (err) {
  process.stderr.write(`claude-code-notifier ensure-deps: ${err.message}\n`);
}

process.exit(0);
```

- [ ] **Step 2: Manual smoke test — already-installed case (fast path)**

Run: `node scripts/ensure-deps.js`

Expected: exits 0 immediately (under ~100ms). `node_modules/node-notifier` already exists from Task 3.

- [ ] **Step 3: Manual smoke test — install path**

Run:

```bash
rm -rf node_modules package-lock.json
node scripts/ensure-deps.js
```

Expected: exits 0. After it completes, `node_modules/node-notifier/` exists.

Then restore state for tests:

Run: `npm test`

Expected: all tests pass again.

- [ ] **Step 4: Commit**

```bash
git add scripts/ensure-deps.js package-lock.json
git commit -m "feat: add SessionStart ensure-deps script"
```

---

### Task 5: Wire up hooks

**Files:**
- Create: `hooks/hooks.json`

- [ ] **Step 1: Create `hooks/hooks.json`**

Create `hooks/hooks.json` with:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/ensure-deps.js"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/notify.js"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/notify.js"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Smoke-test notify.js with a fake Stop payload**

Run:

```bash
printf '{"hook_event_name":"Stop","cwd":"%s"}' "$(pwd)" | node scripts/notify.js
```

Expected: a macOS notification appears with title `claude-code-notifier` and body `Claude finished`. No output on stdout/stderr, exit code 0.

- [ ] **Step 3: Smoke-test notify.js with a fake Notification payload**

Run:

```bash
printf '{"hook_event_name":"Notification","cwd":"%s"}' "$(pwd)" | node scripts/notify.js
```

Expected: a notification appears with title `claude-code-notifier` and body `Claude needs input`.

- [ ] **Step 4: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat: wire SessionStart/Stop/Notification hooks"
```

---

### Task 6: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

Create `README.md` with:

````markdown
# claude-code-notifier

A [Claude Code](https://docs.claude.com/claude-code) plugin that shows a native desktop notification when Claude ends a session or requests user input.

- **Stop** → `Claude finished`
- **Notification** → `Claude needs input`

The title of each notification is the name of the project folder (the basename of the session's working directory).

## Prerequisites

- **Node.js** (current LTS recommended). Run `node --version` to check.
- **Linux only:** a working `notify-send` (usually provided by `libnotify-bin`).

macOS and Windows need no extra setup — `node-notifier` bundles the native helpers.

## Install

1. Install the plugin with Claude Code (e.g., via a plugin marketplace or by adding it to your plugin config).
2. Start a Claude Code session. The `SessionStart` hook will install `node-notifier` on first run (a one-time ~5-second delay).

## Manual dependency install (optional)

If you'd rather not wait for the first-session auto-install:

```bash
cd "$(claude plugin path claude-code-notifier)"  # or the plugin's install directory
npm install
```

## How it works

Three hooks are registered:

- `SessionStart` → `scripts/ensure-deps.js` (idempotent `npm install`)
- `Stop` → `scripts/notify.js`
- `Notification` → `scripts/notify.js`

Hook failures never block Claude Code — all scripts catch errors, log to stderr, and exit 0.

## Development

Run the unit tests:

```bash
npm install
npm test
```

Smoke-test a notification without running Claude Code:

```bash
printf '{"hook_event_name":"Stop","cwd":"%s"}' "$(pwd)" | node scripts/notify.js
```

## License

MIT
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

### Task 7: End-to-end verification in Claude Code (macOS)

This is a manual verification task. No code changes.

- [ ] **Step 1: Install the plugin into Claude Code**

Follow the user's preferred method for installing a local plugin (e.g., adding the local path to the Claude Code plugin config). Confirm Claude Code picks up `claude-code-notifier`.

- [ ] **Step 2: First session — verify `ensure-deps` runs**

Before starting, temporarily remove `node_modules` in the plugin directory to simulate a fresh install:

```bash
rm -rf node_modules
```

Start a new Claude Code session. Expected: `node_modules/node-notifier` exists after the session starts (the `SessionStart` hook ran).

- [ ] **Step 3: Trigger `Notification`**

In the running session, ask Claude to do something that requires permission (for example, run a command the user hasn't pre-approved). Expected: a desktop notification appears — title = project folder name, body = `Claude needs input`, with sound.

- [ ] **Step 4: Trigger `Stop`**

End the session normally. Expected: a desktop notification appears — title = project folder name, body = `Claude finished`, with sound.

- [ ] **Step 5: Record the result**

If both notifications appeared correctly on macOS, the task is complete. Cross-platform verification on Windows and Linux is deferred to environments the user has access to; note any findings in a follow-up issue.

No commit required for this task (documentation-free manual verification).

---

## Self-review notes

- **Spec coverage:**
  - Notification content (title/body rules) — Task 2 tests, Task 3 implementation.
  - Runtime/dependency (Node + node-notifier) — Task 1 (package.json), Task 3 (install).
  - File layout — covered by Task 1 (manifest/package), Task 2–3 (scripts), Task 4 (ensure-deps), Task 5 (hooks), Task 6 (README).
  - Hook wiring (three events) — Task 5.
  - Component behavior for `notify.js` and `ensure-deps.js` — Tasks 3 and 4.
  - Unit tests for `buildNotification` — Task 2.
  - Error handling (exit 0, fallback title, missing deps) — covered by `buildNotification` fallback tests (Task 2), try/catch in `main` (Task 3), try/catch in `ensure-deps.js` (Task 4).
  - Manual cross-OS verification — Task 7 (macOS primary; Windows/Linux deferred per spec).
  - README prerequisites — Task 6.
- **Placeholder scan:** none found.
- **Type/name consistency:** `buildNotification` signature identical across tasks 2 and 3; `node_modules/node-notifier` marker path identical across tasks 3 and 4; hook script paths identical across tasks 4 and 5.
