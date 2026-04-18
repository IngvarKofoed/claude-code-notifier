const prompts = require('prompts');
const { readConfig, writeConfig } = require('./config');
const { configPath } = require('./paths');

const SOUND_CHOICES = [
  { title: 'Bottle (default)', value: true },
  { title: 'Glass', value: 'Glass' },
  { title: 'Hero', value: 'Hero' },
  { title: 'Ping', value: 'Ping' },
  { title: 'Purr', value: 'Purr' },
  { title: 'Submarine', value: 'Submarine' },
  { title: 'Tink', value: 'Tink' },
  { title: 'Funk', value: 'Funk' },
  { title: '— silent —', value: false },
];

function currentSoundIndex(sound) {
  const idx = SOUND_CHOICES.findIndex((c) => c.value === sound);
  return idx >= 0 ? idx : 0;
}

async function main() {
  if (!process.stdin.isTTY) {
    process.stderr.write(
      'claude-code-notifier configure: this wizard needs an interactive terminal.\n' +
        'Run it in a fresh terminal window, not inside a captured session.\n',
    );
    process.exit(1);
  }

  const current = readConfig();

  const answers = await prompts(
    [
      {
        type: 'select',
        name: 'sound',
        message: 'Notification sound',
        choices: SOUND_CHOICES,
        initial: currentSoundIndex(current.sound),
      },
      {
        type: 'toggle',
        name: 'stopEnabled',
        message: 'Notify on Stop (Claude finished)?',
        initial: current.events.Stop,
        active: 'yes',
        inactive: 'no',
      },
      {
        type: 'toggle',
        name: 'notificationEnabled',
        message: 'Notify on Notification (Claude needs input)?',
        initial: current.events.Notification,
        active: 'yes',
        inactive: 'no',
      },
    ],
    {
      onCancel: () => {
        process.stdout.write('\nCancelled. No changes saved.\n');
        process.exit(0);
      },
    },
  );

  const next = {
    sound: answers.sound,
    events: {
      Stop: answers.stopEnabled,
      Notification: answers.notificationEnabled,
    },
  };

  writeConfig(next);
  process.stdout.write(`\nSaved to ${configPath()}\n`);
}

main().catch((err) => {
  process.stderr.write(`claude-code-notifier configure: ${err.message}\n`);
  process.exit(1);
});
