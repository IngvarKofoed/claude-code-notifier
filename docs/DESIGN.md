# claude-code-notifier — Design

**Date:** 2026-04-18
**Repo:** https://github.com/IngvarKofoed/claude-code-notifier

## Summary

A cross-platform Claude Code plugin that wires the `Stop` and `Notification` hooks to native OS notifications via `node-notifier`. Title is the project folder name, body is `"Claude finished"` or `"Claude needs input"`, same sound for both events. Zero configuration. A `SessionStart` hook auto-installs dependencies on first run.

## Goals

- Send a native-looking desktop notification when Claude Code ends a session (`Stop`) or requests user input (`Notification`).
- Work on macOS, Windows, and Linux with comparable visual quality.
- Require zero configuration from the user.
- Never block or fail a Claude Code session, even if notifications fail.

## Non-goals

- Rich notification content (last message, duration, action buttons).
- Visual or auditory differentiation between `Stop` and `Notification` events.
- User-facing configuration (sounds, icons, templates, per-project overrides).
- Hooks beyond `Stop` and `Notification` (no `UserPromptSubmit`, `PreToolUse`, etc.).
- CI for cross-platform verification.

## Notification content

- **Title:** `path.basename(cwd)` from the hook JSON payload. Falls back to `"Claude Code"` if `cwd` is empty or missing.
- **Body:**
  - `Notification` event → `"Claude needs input"`
  - `Stop` event → `"Claude finished"`
- **Sound:** default OS notification sound, on for both events.
- **Icon / styling:** default provided by `node-notifier` for each platform.

Example (project directory `~/code/my-app`):
- Title: `my-app`
- Body: `Claude finished`

## Runtime & dependencies

- **Runtime:** Node.js (user-provided; documented as a prerequisite).
- **Dependency:** `node-notifier` — handles platform dispatch to `terminal-notifier` (macOS), `SnoreToast` (Windows), and `notify-send` (Linux). Bundled binaries ship with the npm package.

## File layout

```
claude-code-notifier/
├── .claude-plugin/
│   └── plugin.json              # plugin manifest
├── hooks/
│   └── hooks.json               # Stop + Notification + SessionStart wiring
├── scripts/
│   ├── notify.js                # reads stdin JSON, sends notification
│   ├── ensure-deps.js           # idempotent dep install for SessionStart
│   └── notify.test.js           # unit tests (node --test)
├── package.json                 # declares node-notifier dep
├── .gitignore                   # excludes node_modules
└── README.md
```

## Hook wiring

`hooks/hooks.json` registers three hooks. All commands invoke Node via `${CLAUDE_PLUGIN_ROOT}`.

- **`SessionStart`** → `node ${CLAUDE_PLUGIN_ROOT}/scripts/ensure-deps.js`
- **`Stop`** → `node ${CLAUDE_PLUGIN_ROOT}/scripts/notify.js`
- **`Notification`** → `node ${CLAUDE_PLUGIN_ROOT}/scripts/notify.js`

## Component behavior

### `scripts/notify.js`

1. Read JSON from stdin.
2. Parse `hook_event_name` and `cwd` from the payload.
3. `title = path.basename(cwd) || "Claude Code"`.
4. `body = hook_event_name === "Notification" ? "Claude needs input" : "Claude finished"`.
5. Call `notifier.notify({ title, message: body, sound: true })`.
6. Always `process.exit(0)`.

Errors (including missing `node_modules`) are caught, logged to stderr, and swallowed.

### `scripts/ensure-deps.js`

1. Check whether `<pluginRoot>/node_modules/node-notifier` exists.
2. If missing, run `npm install --silent` with `cwd = pluginRoot`.
3. Swallow errors and exit 0.

Idempotent: second and later sessions are near-instant no-ops.

### `scripts/notify.test.js`

Uses Node's built-in `node --test` runner. No test framework dependency.

Covers:
- `Notification` event with a valid `cwd` → correct title and body.
- `Stop` event with a valid `cwd` → correct title and body.
- Empty/missing `cwd` → title falls back to `"Claude Code"`.

`node-notifier` is mocked via module injection or a thin wrapper to assert the call arguments without triggering a real notification.

## Error handling & edge cases

- **Hooks never fail the session.** All scripts catch errors, log to stderr, exit 0.
- **Empty/missing `cwd`.** Title falls back to `"Claude Code"`.
- **`node_modules` missing at notify time** (e.g., `ensure-deps.js` failed or hasn't run). `require('node-notifier')` throws; caught and swallowed. No notification fires; Claude is unaffected.
- **Platform without a working notifier.** If `node-notifier` errors (e.g., missing `notify-send` on Linux, unsupported platform), the error is caught and swallowed; no notification fires, no fallback logic.
- **Concurrent sessions.** `ensure-deps.js` is idempotent; duplicate `npm install` is safe.
- **No Node.js installed.** Hook command `node` fails; Claude logs and continues. README documents Node as a prerequisite.

## Testing

- **Manual verification (primary).** Install the plugin locally and run a Claude Code session on each target OS:
  - **macOS:** trigger `Notification` (e.g., request a command needing permission) and `Stop` (end session). Confirm two notifications appear with correct title, body, and sound.
  - **Windows:** same verification on a Windows machine.
  - **Linux:** bonus verification where `notify-send` is available.
- **Unit tests (light).** `scripts/notify.test.js` as described above, run with `node --test`.
- **No CI initially.** Revisit if the plugin grows.

## Prerequisites (documented in README)

- Node.js (tested on the current LTS).
- On Linux, a working `notify-send` (typically provided by `libnotify-bin` or equivalent).
- macOS and Windows: no extra prerequisites; `node-notifier` bundles the needed binaries.
