import { createCleanCommand } from './clean';
import { createCommitCommand } from './commit';
import { createFixCommand } from './format';
import { createReleaseCommand } from './release';

export let commands = {
  createCommitCommand,
  createReleaseCommand,
  createCleanCommand,
  createFixCommand
};
