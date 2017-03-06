import { assist } from './assist';
import { createCleanCommand } from './clean';
import { createCommitCommand } from './commit';
import { createFormatCommand } from './format';
import { release } from './release';

export let commands = {
  assist,
  createCommitCommand,
  release,
  createCleanCommand,
  createFormatCommand
};
