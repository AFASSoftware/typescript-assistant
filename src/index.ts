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

if (process.argv.length === 3) {
  let command = process.argv[2];
  if (command === 'commit' || command === 'c') {
    // commit: format+compile+lint
    argsOk = true;
    formatter.format().then(() => {
      formatter.startVerifying('compile-compiled');
      linter.start('format-verified');
      bus.register('lint-linted', () => {
        compiler.stop();
        formatter.stopVerifying();
        linter.stop();
        git.execute(['add', '.']).then(
          () => {
            git.execute(['commit', '--no-verify']).then(() => {
              logger.log('commit', 'committed');
              process.exit(0);
            });
          },
          (error: any) => logger.error('commit', error)
        );
      });
      compiler.start();
    });
  }
} else if (process.argv.length === 2) {
  // Normal operation: keep compiling+checking-format+linting
  formatter.startVerifying('compile-started');
  mocha.start('compile-compiled');
  linter.start('format-verified');
  compiler.start();
  argsOk = true;
}

if (!argsOk) {
  console.error('Usage: tsa || tsa c[ommit]');
  process.exit(1);
}
