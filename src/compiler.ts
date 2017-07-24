import { Bus } from './bus';
import { Logger } from './logger';
import { Task, TaskRunner } from './taskrunner';
import { absolutePath } from './util';

export interface Compiler {
  start(): Promise<void>;
  stop(): void;
}

export let createCompiler = (dependencies: { taskRunner: TaskRunner, logger: Logger, bus: Bus }): Compiler => {
  let { taskRunner, logger, bus } = dependencies;

  let busy = true;
  let errors: string[] = [];

  let handleOutput = (line: string) => {
    if (/Starting incremental compilation...$/.test(line)) {
      busy = true;
      logger.log('compiler', 'compiling...');
      errors = [];
      bus.signal('compile-started');
    } else if (/Compilation complete\. Watching for file changes.$/.test(line)) {
      busy = false;
      logger.log('compiler', `ready, found ${errors.length} errors`);
      bus.signal(errors.length === 0 ? 'compile-compiled' : 'compile-errored');
    } else {
      let matches = /([^(]+)\((\d+),(\d+)\): (error TS\d+: )?(.*)$/.exec(line);
      if (matches) {
        errors.push(matches[0]);
        logger.log('compiler', `${absolutePath(matches[1])}:${matches[2]}:${matches[3]} ${matches[5]}`);
      } else {
        matches = /error TS\d+: (.+)$/.exec(line);
        if (matches) {
          errors.push(matches[1]);
          logger.log('compiler', `${matches[1]}`);
        } else {
          // just echo the output
          logger.log('compiler', line);
        }
      }
    }
    return true;
  };

  let task: Task;

  return {
    start: () => {
      task = taskRunner.runTask('./node_modules/.bin/tsc', ['--watch'], {
        name: 'tsc',
        logger,
        handleOutput
      });
      return task.result;
    },
    stop: () => {
      task.kill();
      task = undefined;
    }
  };
};
