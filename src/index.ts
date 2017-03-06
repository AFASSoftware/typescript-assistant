#!/usr/bin/env node

import { createBus } from './bus';
import { createFormatter } from './code-style/formatter';
import { createLinter } from './code-style/linter';
import { commands } from './commands/index';
import { createCompiler } from './compiler';
import { createConfiguration } from './configuration';
import { createGit } from './git';
import { createConsoleLogger } from './logger';
import { createDefaultTaskRunner, createWindowsTaskRunner } from './taskrunner';
import { createMocha } from './testing/mocha';
import { Dependencies } from './dependencies';

import { sep } from 'path';
import { createInjector } from './injector';

let argsOk = false;

let logger = createConsoleLogger();
let taskRunner = sep === '\\' ? createWindowsTaskRunner() : createDefaultTaskRunner();
let bus = createBus();
let configuration = createConfiguration();

let dependencies: Partial<Dependencies> = {
  configuration, bus, logger, taskRunner
};
let injector = createInjector(dependencies);

// TODO: Use injector.inject
let compiler = createCompiler({ taskRunner, logger, bus });
let git = createGit({ taskRunner, logger });
let formatter = createFormatter({ git, logger, bus });
let linter = createLinter({ taskRunner, git, logger, bus });
let mocha = createMocha({ configuration, taskRunner, logger, bus, git });

/* tslint:disable:no-console */
if (process.argv.length === 3) {
  let command = process.argv[2];
  if (command === 'format' || command === 'f') {
    argsOk = true;
    commands.format(dependencies);
  } else if (command === 'commit' || command === 'c') {
    // commit: format+compile+lint
    argsOk = true;
    commands.commit(dependencies);
  } else if (command === 'clean') {
    argsOk = true;
    commands.clean(dependencies);
  } else if (command === 'release') {
    argsOk = true;
    commands.release(dependencies).then(
      () => {
        console.log('Done');
      },
      (error) => {
        console.error(error);
        process.exit(1);
      }
    );
  }
} else if (process.argv.length === 2) {
  // Normal operation: keep compiling+checking-format+linting
  argsOk = true;
  commands.assist(dependencies);
}

if (!argsOk) {
  console.error('Usage: tsa || tsa f[ormat] || tsa c[ommit] || tsa release || tsa clean');
  process.exit(1);
}
/* tslint:enable:no-console */
