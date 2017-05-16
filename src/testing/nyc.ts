import { Task, TaskRunner } from '../taskrunner';
import { Logger } from '../logger';
import { Bus } from '../bus';

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
    let handleOutput = (line: string) => {
      if (task === runningTask) {
        let notOk = /not ok \d+ (.*)/.exec(line);
        if (notOk) {
          logger.error('nyc', 'Test failed: ' + notOk[1]);
        } else {
          logger.error('nyc', 'Unknown: ' + line);
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
