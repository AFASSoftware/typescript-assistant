#!/usr/bin/env node

import { createFormatter } from './code-style/formatter';
import { createLinter } from './code-style/linter';
import { createCompiler } from './compiler';
import { createConfiguration } from './configuration';
import { createGit } from './git';
import { createConsoleLogger } from './logger';
import { createDefaultTaskRunner, createWindowsTaskRunner } from './taskrunner';
import { createMocha } from './testing/mocha';
import { Dependencies } from './dependencies';

import { sep } from 'path';
import { createInjector } from './injector';
import { createFixCommand } from './commands/format';
import { createCleanCommand } from './commands/clean';
import { createCommitCommand } from './commands/commit';
import { createReleaseCommand } from './commands/release';
import { createAssistCommand } from './commands/assist';
import { createNyc } from './testing/nyc';
import { createBus } from './bus';

let argsOk = false;

let logger = createConsoleLogger();
let taskRunner = sep === '\\' ? createWindowsTaskRunner() : createDefaultTaskRunner();
let bus = createBus();
let configuration = createConfiguration();

let dependencies: Partial<Dependencies> = {
  configuration, bus, logger, taskRunner
};
let { inject } = createInjector(dependencies);

dependencies.inject = inject;
dependencies.compiler = inject(createCompiler);
dependencies.git = inject(createGit);
dependencies.formatter = inject(createFormatter);
dependencies.linter = inject(createLinter);
dependencies.mocha = inject(createMocha);
dependencies.nyc = inject(createNyc);

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
  } else if (command === 'commit' || command === 'c') {
    // createCommitCommand: createFixCommand+compile+lint
    argsOk = true;
    inject(createCommitCommand).execute().then(success, failure);
  } else if (command === 'clean') {
    argsOk = true;
    inject(createCleanCommand).execute();
  } else if (command === 'release') {
    argsOk = true;
    inject(createReleaseCommand).execute().then(success, failure);
  }
} else if (process.argv.length === 2) {
  // Normal operation: keep compiling+checking-createFixCommand+linting
  argsOk = true;
  inject(createAssistCommand).execute();
}

if (!argsOk) {
  console.error('Usage: tsa || tsa f[ix] || tsa c[ommit] || tsa release || tsa clean');
  process.exit(1);
}
/* tslint:enable:no-console */
