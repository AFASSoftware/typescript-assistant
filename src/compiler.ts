import {Logger} from './logger';
import {TaskRunner, Task} from './taskrunner';
import {Bus} from './bus';
import {absolutePath} from './util';

export interface Compiler {
  start(): void;
  stop(): void;
}

export let createCompiler = (config: { taskRunner: TaskRunner, logger: Logger, bus: Bus }): Compiler => {
  let {taskRunner, logger, bus} = config;

  let busy = true;
  let errors: string[] = [];

  let handleOutput = (line: string) => {
    if (/Starting incremental compilation...$/.test(line)) {
      busy = true;
      logger.log('compiler', 'compiling...');
      errors = [];
      bus.signal('compile-started');
      return true;
    } else if (/Compilation complete\. Watching for file changes.$/.test(line)) {
      busy = false;
      logger.log('compiler', `ready, found ${errors.length} errors`);
      bus.signal(errors.length === 0 ? 'compile-compiled' : 'compile-errored');
      return true;
    } else {
      let matches = /([^(]+)\((\d+),(\d+)\): error TS\d+: (.*)$/.exec(line);
      if (matches) {
        errors.push(matches[0]);
        logger.log('compiler', `${absolutePath(matches[1])}:${matches[2]}:${matches[3]} ${matches[4]}`);
        return true;
      }
    }
    return false;
  };

  let handleClose = (code: number) => {
    logger.error('compiler', `tsc exited with code ${code}.`);
    return true;
  };

  let task: Task;

  return {
    start: () => {
      task = taskRunner.runTask('./node_modules/.bin/tsc', ['--watch'], {
        name: 'tsc',
        logger,
        handleOutput,
        handleClose
      });
    },
    stop: () => {
      task.kill();
      task = undefined;
    }
  };
};
