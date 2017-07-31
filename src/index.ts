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

let argsOk = false;

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

if (process.argv.length === 3) {
  let command = process.argv[2];
  if (command === 'format' || command === 'fix' || command === 'f') {
    argsOk = true;
    inject(createFixCommand).execute().then(success, failure);
  } else if (command === 'pre-commit') {
    argsOk = true;
    inject(createPreCommitCommand).execute().then(success, failure);
  } else if (command === 'post-checkout') {
    argsOk = true;
    inject(createPostCheckoutCommand).execute();
  } else if (command === 'post-merge') {
    argsOk = true;
    inject(createPostMergeCommand).execute();
  } else if (command === 'clean') {
    argsOk = true;
    inject(createCleanCommand).execute();
  } else if (command === 'release') {
    argsOk = true;
    inject(createReleaseCommand).execute().then(success, failure);
  }
} else if (process.argv.length === 2) {
  // Normal operation: keep compiling+testing+linting
  argsOk = true;
  inject(createAssistCommand).execute();
}

if (!argsOk) {
  console.error('Usage: tsa || tsa f[ix] || tsa release || tsa clean ');
  console.error('  || tsa pre-commit || tsa post-checkout || tsa post-merge');
  process.exit(1);
}
/* tslint:enable:no-console */
