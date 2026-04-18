---
description: Show how to launch the claude-code-notifier configuration wizard
---

The user wants to configure `claude-code-notifier`. The configuration wizard is an interactive CLI that needs a real TTY, so it cannot run inside Claude Code (stdin is captured here). Show them this exact command to run in a fresh terminal window:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/configure.js"
```

Present the command in a copy-friendly code block exactly as shown above (with the `${CLAUDE_PLUGIN_ROOT}` placeholder resolved to the actual path). Briefly mention that the wizard will ask about notification sound and which events (Stop/Notification) to enable, and will save the result to the XDG config path. No other action is needed from you.
