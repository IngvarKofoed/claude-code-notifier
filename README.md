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
