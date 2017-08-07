#!/usr/bin/env node

import { createFormatter } from './code-style/formatter';
import { createLinter } from './code-style/linter';
import { createCompiler } from './compiler';
import { createGit } from './git';
import { createConsoleLogger } from './logger';
import { createDefaultTaskRunner, createWindowsTaskRunner } from './taskrunner';
import { Dependencies } from './dependencies';

import { sep } from 'path';
import { createInjector } from './injector';
import { createFixCommand } from './commands/format';
import { createCleanCommand } from './commands/clean';
import { createReleaseCommand } from './commands/release';
import { createAssistCommand } from './commands/assist';
import { createNyc } from './testing/nyc';
import { createBus } from './bus';
import { createPostCheckoutCommand } from './commands/post-checkout';
import { createPostMergeCommand } from './commands/post-merge';
import { createPreCommitCommand } from './commands/pre-commit';
import { createWatcher } from './watcher';
import { createCICommand } from './commands/ci';
import * as yargsModule from 'yargs';

let logger = createConsoleLogger();
let taskRunner = sep === '\\' ? createWindowsTaskRunner() : createDefaultTaskRunner();
let bus = createBus();

let dependencies: Partial<Dependencies> = {
  bus, logger, taskRunner
};
let { inject } = createInjector(dependencies);

dependencies.inject = inject;
dependencies.compiler = inject(createCompiler);
dependencies.git = inject(createGit);
dependencies.formatter = inject(createFormatter);
dependencies.linter = inject(createLinter);
dependencies.nyc = inject(createNyc);
dependencies.watcher = inject(createWatcher);

/* tslint:disable:no-console */
let success = () => {
  process.exit(0);
};

let failure = (error: any) => {
  console.error(error);
  process.exit(1);
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
  inject(createFixCommand).execute().then(success, failure);
});

yargsModule.command(['clean', 'c'], 'Deletes all output files and intermediate files', {}, (yargs) => {
  inject(createCleanCommand).execute();
});

yargsModule.command(['release'], 'Interactively makes a new version number, tags, pushes and publishes to npm', {}, (yargs) => {
  inject(createReleaseCommand).execute();
});

yargsModule.command(['ci'], 'Runs all tools in parallel to find errors', {
  '--': { describe: 'Arguments to be passed to tsc' }
}, (yargs) => {
  let tscArgs = yargs._.slice(1);
  inject(createCICommand).execute({ tscArgs });
});

yargsModule.command('pre-commit', 'Pre-commit git hook for husky', {}, (yargs) => {
  inject(createPreCommitCommand).execute().then(success, failure);
});

yargsModule.command('post-checkout', 'Post-checkout git hook for husky', {}, (yargs) => {
  inject(createPostCheckoutCommand).execute();
});

yargsModule.command('post-merge', 'Post-merge git hook for husky', {}, (yargs) => {
  inject(createPostMergeCommand).execute();
});

// if (!argsOk) {
//   console.error('Usage: tsa || tsa f[ix] || tsa release || tsa clean || tsa ci');
//   console.error('  || tsa pre-commit || tsa post-checkout || tsa post-merge');
//   process.exit(1);
// }

yargsModule.help().strict().argv;

/* tslint:enable:no-console */
