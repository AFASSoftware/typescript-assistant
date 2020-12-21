import { Task, TaskRunner } from '../taskrunner';
import { Logger } from '../logger';
import { Bus, EventType } from '../bus';
import { absolutePath } from '../util';
import { Git } from '../git';

export interface NYC {
  start(triggers: EventType[], withCoverage: boolean): void;
  stop(): void;
  run(withCoverage?: boolean): Promise<boolean>;
}

let delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export let createNyc = (dependencies: { taskRunner: TaskRunner, logger: Logger, bus: Bus, git: Git }): NYC => {
  let { taskRunner, logger, bus, git } = dependencies;
  let runningTask: Task | undefined;
  let coolingDown: Promise<void> | undefined;

  let startNyc = async (withCoverage?: boolean): Promise<boolean> => {
    let hasFailingTest = false;
    let myCoolingDown = delay(100);
    coolingDown = myCoolingDown;
    await (myCoolingDown);
    if (coolingDown !== myCoolingDown) {
      return false;
    }

    if (runningTask) {
      logger.log('nyc', 'Aborting previous nyc run');
      runningTask.kill();
      runningTask = undefined;
    } else {
      bus.report({ tool: 'test', status: 'busy' });
      bus.report({ tool: 'coverage', status: 'busy' });
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
          hasFailingTest = true;
        } else if (contextIt) {
          logger.log('nyc', `${absolutePath(contextIt[2])} ${errorLine}`);
          errorLine = '';
        }
      }
      return true;
    };
    let handleError = (line: string) => {
      if (task === runningTask && !line.startsWith('ERROR: Coverage for')) {
        logger.error('nyc', line);
      }
      return true;
    };
    if (withCoverage === false) {
      logger.log('nyc', 'running tests without coverage');
      runningTask = taskRunner.runTask(
        './node_modules/.bin/mocha',
        ('--require ts-node/register/transpile-only --exit --reporter tap test/**/*-tests.ts*').split(' '),
        {
          name: 'nyc',
          logger,
          handleOutput,
          handleError
        });
    } else {
      runningTask = taskRunner.runTask(
        './node_modules/.bin/nyc',
        ('--check-coverage -- ' +
          './node_modules/.bin/mocha --require ts-node/register/transpile-only --exit --reporter tap test/**/*-tests.ts*').split(' '),
        {
          name: 'nyc',
          logger,
          handleOutput,
          handleError
        });
    }
    let task = runningTask;
    return runningTask.result.then(() => {
      if (task === runningTask) {
        runningTask = undefined;
        logger.log('nyc', 'code coverage OK');
        bus.report({ tool: 'test', status: 'ready', errors: 0 });
        bus.report({ tool: 'coverage', status: 'ready', errors: 0 });
      }
      return true;
    }).catch(async () => {
      if (task === runningTask) {
        runningTask = undefined;
        logger.log('nyc', 'code coverage FAILED');
        bus.report({ tool: 'test', status: 'ready', errors: hasFailingTest ? 1 : 0 });
        bus.report({ tool: 'coverage', status: 'ready', errors: 1 });
      }
      let isOnBranch = await git.isOnBranch();
      return isOnBranch && !hasFailingTest;
    });
  };

  let callback: (() => Promise<boolean>) | undefined;

  return {
    run: (withCoverage?: boolean) => startNyc(withCoverage).catch(() => false),
    start: (triggers: EventType[], withCoverage) => {
      callback = () => startNyc(withCoverage);
      bus.registerAll(triggers, callback);
      callback().catch(() => false);
    },
    stop: () => {
      bus.unregister(callback!);
    }
  };
};
