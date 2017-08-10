#!/usr/bin/env node

import { createFixCommand } from './commands/fix';
import { createCleanCommand } from './commands/clean';
import { createReleaseCommand } from './commands/release';
import { createAssistCommand } from './commands/assist';
import { createPostCheckoutCommand } from './commands/post-checkout';
import { createPostMergeCommand } from './commands/post-merge';
import { createPreCommitCommand } from './commands/pre-commit';
import { createCICommand } from './commands/ci';
import * as yargsModule from 'yargs';
import { createDependencyInjector } from './dependency-injector';
import { createPrePushCommand } from './commands/pre-push';

let inject = createDependencyInjector();

/* tslint:disable:no-console */
let onSuccess = () => {
  process.exit(0);
};

let onFailure = (error: any) => {
  console.error(error);
  process.exit(1);
};

let failIfUnsuccessful = (success: boolean) => {
  if (!success) {
    process.exit(1);
  }
};

yargsModule.command(['assist', '*'], 'Watches for file changes and outputs current errors and violations', {}, (yargs) => {
  if (yargs._.length === 0 || yargs._.length === 1 && yargs._[0] === 'assist') {
    inject(createAssistCommand).execute();
  } else {
    console.error('Unknown command');
    process.exit(1);
  }
});

yargsModule.command(['fix', 'f'], 'Formats changed files and applies tslint fixes', {}, (yargs) => {
  inject(createFixCommand).execute().then(onSuccess, onFailure);
});

yargsModule.command(['clean', 'c'], 'Deletes all output files and intermediate files', {}, (yargs) => {
  inject(createCleanCommand).execute();
});

yargsModule.command(['release'], 'Interactively makes a new version number, tags, pushes and publishes to npm', {}, (yargs) => {
  inject(createReleaseCommand).execute().then(onSuccess, onFailure);
});

yargsModule.command(['ci'], 'Runs all tools in parallel to find errors', {
  '--': { describe: 'Arguments to be passed to tsc' }
}, (yargs) => {
  let tscArgs = yargs._.slice(1);
  inject(createCICommand).execute({ tscArgs }).then(failIfUnsuccessful, onFailure);
});

yargsModule.command('pre-commit', 'Pre-commit git hook for husky', {}, (yargs) => {
  inject(createPreCommitCommand).execute().then(onSuccess, onFailure);
});

yargsModule.command('post-checkout', 'Post-checkout git hook for husky', {}, (yargs) => {
  inject(createPostCheckoutCommand).execute();
});

yargsModule.command('post-merge', 'Post-merge git hook for husky', {}, (yargs) => {
  inject(createPostMergeCommand).execute();
});

yargsModule.command('pre-push', 'Pre-push git hook for husky', {}, (yargs) => {
  inject(createPrePushCommand).execute().then(failIfUnsuccessful, onFailure);
});

yargsModule.help().strict().argv;

/* tslint:enable:no-console */
