import { Task, TaskRunner } from '../taskrunner';
import { Logger } from '../logger';
import { Bus } from '../bus';
import { absolutePath } from '../util';

export interface NYC {
  start(): void;
  stop(): void;
  run(): Promise<boolean>;
}

export let createNyc = (dependencies: { taskRunner: TaskRunner, logger: Logger, bus: Bus }): NYC => {
  let { taskRunner, logger, bus } = dependencies;
  let runningTask: Task | undefined;

  let startNyc = (): Promise<boolean> => {
    if (runningTask) {
      runningTask.kill();
    }
    let errorLine = '';
    let lastLineWasNotOk = false;
    let handleOutput = (line: string) => {
      if (task === runningTask) {
        if (lastLineWasNotOk) {
          errorLine = line;
          lastLineWasNotOk = false;
        }
        // For extra debug info:
        // if (!/^ok \d+ (.*)/.exec(line)) { logger.log('nyc', '  [ ' + line); }
        let notOk = /^not ok \d+ (.*)/.exec(line);
        let contextIt = /^(} )?at Context\.\S+ \(([^)]+)\)/.exec(line);
        if (notOk) {
          lastLineWasNotOk = true;
          logger.log('nyc', `FAILED: ${notOk[1]}`);
        } else if (contextIt) {
          logger.log('nyc', `${absolutePath(contextIt[2])} ${errorLine}`);
          errorLine = '';
        }
      }
      return true;
    };
    let handleError = (line: string) => {
      if (task === runningTask) {
        // Not so useful info logger.error('nyc', 'STDERR '+line);
      }
      return true;
    };
    let task = runningTask = taskRunner.runTask(
      './node_modules/.bin/cross-env',
      ('TS_NODE_FAST=true ./node_modules/.bin/nyc --check-coverage -- ' +
        './node_modules/.bin/mocha --compilers ts:ts-node/register --reporter tap --recursive').split(' '),
      {
        name: 'nyc',
        logger,
        handleOutput,
        handleError
      });
    return runningTask.result.then(() => {
      if (task === runningTask) {
        logger.log('nyc', 'code coverage OK');
      }
      return true;
    }).catch(() => {
      if (task === runningTask) {
        logger.log('nyc', 'code coverage FAILED');
      }
      return false;
    });
  };

  return {
    run: () => startNyc().catch(() => false),
    start: () => {
      bus.registerAll(['compile-started', 'test-files-changed'], startNyc);
      startNyc().catch(() => false);
    },
    stop: () => {
      bus.unregister(startNyc);
    }
  };
};
