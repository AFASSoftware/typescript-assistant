import { Task, TaskRunner } from '../taskrunner';
import { Logger } from '../logger';
import { Bus } from '../bus';
import { absolutePath } from '../util';

export interface NYC {
  start(): void;
  stop(): void;
}

export let createNyc = (dependencies: { taskRunner: TaskRunner, logger: Logger, bus: Bus }): NYC => {
  let {taskRunner, logger, bus} = dependencies;
  let runningTask: Task | undefined;

  let startNyc = () => {
    if (runningTask) {
      runningTask.kill();
    }
    let lastNotAtLine = '';
    let handleOutput = (line: string) => {
      if (task === runningTask) {
        let notOk = /not ok \d+ (.*)/.exec(line);
        let contextIt = /^\s*at Context.it \(([^)]+)\)/.exec(line);
        if (notOk) {
          logger.log('nyc', 'FAILED: ' + notOk[1]);
        } else if (contextIt) {
          logger.log('nyc', absolutePath(contextIt[1]) + ' ' + lastNotAtLine);
        } else {
          // logger.error('nyc', 'Unknown: ' + line);
          if (!/^\s*at.*$/.test(line)) {
            lastNotAtLine = line;
          }
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
      'TS_NODE_FAST=true nyc --check-coverage -- mocha --compilers ts:ts-node/register --reporter tap --recursive'.split(' '),
      {
        name: 'nyc',
        logger,
        handleOutput,
        handleError
      });
    runningTask.result.then(() => {
      if (task === runningTask) {
        logger.log('nyc', 'code coverage OK');
      }
    }).catch(() => {
      if (task === runningTask) {
        logger.log('nyc', 'code coverage FAILED');
      }
    });
  };

  return {
    start: () => {
      bus.register('compile-started', startNyc);
      startNyc();
    },
    stop: () => {
      bus.unregister(startNyc);
    }
  };
};
