#!/usr/bin/env node

import {createConsoleLogger} from './logger';
import {createDefaultTaskRunner, createWindowsTaskRunner} from './taskrunner';
import {createCompiler} from './compiler';
import {createFormatter} from './code-style/formatter';
import {createLinter} from './code-style/linter';
import {createMocha} from './testing/mocha';
import {createBus} from './bus';
import {createGit} from './git';
import {createConfiguration} from './configuration';
import {commands} from './commands/index';
import {Toolbox} from './toolbox';

import {sep} from 'path';

let logger = createConsoleLogger();

let taskRunner = sep === '\\' ? createWindowsTaskRunner() : createDefaultTaskRunner();

let bus = createBus();

let argsOk = false;

let configuration = createConfiguration();
let compiler = createCompiler({ taskRunner, logger, bus });
let git = createGit({ taskRunner, logger });
let formatter = createFormatter({ git, logger, bus });
let linter = createLinter({ taskRunner, git, logger, bus });
let mocha = createMocha({ configuration, taskRunner, logger, bus, git });

let toolbox: Toolbox = {
  compiler, git, formatter, linter, mocha, configuration, bus, logger, taskRunner
};

if (process.argv.length === 3) {
  let command = process.argv[2];
  if (command === 'commit' || command === 'c') {
    // commit: format+compile+lint
    argsOk = true;
    commands.commit(toolbox);
  } else if (command === 'clean') {
    argsOk = true;
    commands.clean(toolbox);
  } else if (command === 'release') {
    argsOk = true;
    commands.release(toolbox).then(
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
  commands.assist(toolbox);
}

if (!argsOk) {
  console.error('Usage: tsa || tsa c[ommit] || tsa release || tsa clean');
  process.exit(1);
}
