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
import { createFormatCommand } from './commands/format';
import { createCleanCommand } from './commands/clean';
import { createCommitCommand } from './commands/commit';

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

/* tslint:disable:no-console */
if (process.argv.length === 3) {
  let command = process.argv[2];
  if (command === 'format' || command === 'f') {
    argsOk = true;
    inject(createFormatCommand).execute();
  } else if (command === 'createCommitCommand' || command === 'c') {
    // createCommitCommand: createFormatCommand+compile+lint
    argsOk = true;
    inject(createCommitCommand);
  } else if (command === 'createCleanCommand') {
    argsOk = true;
    inject(createCleanCommand).execute();
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
  // Normal operation: keep compiling+checking-createFormatCommand+linting
  argsOk = true;
  commands.assist(dependencies);
}

if (!argsOk) {
  console.error('Usage: tsa || tsa f[ormat] || tsa c[ommit] || tsa release || tsa createCleanCommand');
  process.exit(1);
}
/* tslint:enable:no-console */
