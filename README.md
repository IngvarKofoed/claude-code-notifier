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

Install this plugin using Claude Code's plugin system. See Claude Code's plugin docs for the exact command for your setup; typical options are:

- Add the repository (`https://github.com/IngvarKofoed/claude-code-notifier`) through the `/plugin` command inside Claude Code.
- Clone the repo locally and point Claude Code at the checkout in your plugin configuration.

On the first Claude Code session after installation, the `SessionStart` hook runs `npm install` inside the plugin directory to fetch `node-notifier` (a one-time ~5-second delay). Subsequent sessions are instant.

### Manual dependency install (optional)

If you'd prefer not to wait for the first-session auto-install, run `npm install` inside the plugin's installed directory:

```bash
cd <path-to-plugin-install>
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
