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

Run these commands inside Claude Code:

```
/plugin marketplace add IngvarKofoed/claude-code-notifier
/plugin install claude-code-notifier@claude-code-notifier
/reload-plugins
```

On the first Claude Code session after installation, the `SessionStart` hook runs `npm install` inside the plugin directory to fetch `node-notifier` (a one-time ~5-second delay). Subsequent sessions are instant.

## Update

To pick up new versions pushed to the repo:

```
/plugin marketplace update claude-code-notifier
/plugin uninstall claude-code-notifier
/plugin install claude-code-notifier@claude-code-notifier
/reload-plugins
```

(`/plugin update` alone may not re-fetch the marketplace git clone — the uninstall/install cycle ensures a clean pull.)

## Uninstall

```
/plugin uninstall claude-code-notifier
/plugin marketplace remove claude-code-notifier
/reload-plugins
```

### Manual dependency install (optional)

If you'd prefer not to wait for the first-session auto-install, run `npm install` inside the plugin's installed directory:

```bash
cd <path-to-plugin-install>
npm install
```

## Configuration

Zero-config by default. To change the notification sound or disable one of the two events, run the wizard:

```
/claude-code-notifier:configure
```

That slash command inside Claude Code will print the exact `node ...` command to copy-paste into a fresh terminal (the wizard needs a real TTY and can't run inside Claude Code itself).

**Where settings live:**

- **Config:** `$XDG_CONFIG_HOME/claude-code-notifier/config.json` (default `~/.config/claude-code-notifier/config.json` on macOS/Linux; `%APPDATA%\claude-code-notifier\config.json` on Windows).
- **Log:** `$XDG_STATE_HOME/claude-code-notifier/notifier.log` (default `~/.local/state/claude-code-notifier/notifier.log` on macOS/Linux; `%LOCALAPPDATA%\claude-code-notifier\notifier.log` on Windows). One JSON line per hook invocation, including skipped ones.

**Config file shape:**

```json
{
  "sound": true,
  "events": {
    "Stop": true,
    "Notification": true
  }
}
```

`sound` is `true` (default system sound), `false` (silent), or a macOS sound name (`"Glass"`, `"Hero"`, `"Ping"`, `"Purr"`, `"Submarine"`, `"Tink"`, `"Funk"`). Sound names are mostly ignored on Windows/Linux.

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
