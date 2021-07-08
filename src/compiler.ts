import { Bus } from './bus';
import { Logger } from './logger';
import { Task, TaskRunner } from './taskrunner';
import { absolutePath } from './util';
import * as glob from 'glob';
import { parallelLimit } from 'async';
import * as fs from 'fs';

export interface Compiler {
  start(): void;
  stop(): void;
  runOnce(tscArgs: string[], disabledProjects?: string[]): Promise<boolean>;
}

type TaskFunctionCallback = () => void;
type TaskFunction = (callback: TaskFunctionCallback) => void;

let runningTasks: Task[] = [];

export function createCompiler(dependencies: { taskRunner: TaskRunner, logger: Logger, bus: Bus }): Compiler {
  const { taskRunner, logger, bus } = dependencies;

  let busyCompilers = 0;
  let errors: string[] = [];

  let handleOutput = (line: string) => {
    if (/Starting incremental compilation...$/.test(line)) {
      if (busyCompilers === 0) {
        bus.report({ tool: 'compiler', status: 'busy' });
        errors = [];
      }
      busyCompilers++;
      logger.log('compiler', 'compiling...');
      bus.signal('compile-started');
    } else if (/Watching for file changes.$/.test(line)) {
      busyCompilers--;
      logger.log('compiler', `ready, found ${errors.length} errors`);
      bus.signal(errors.length === 0 ? 'compile-compiled' : 'compile-errored');
      if (busyCompilers === 0) {
        bus.report({ tool: 'compiler', status: 'ready', errors: errors.length });
      }
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

  let taskFunctions: TaskFunction[] = [];

  return {
    runOnce: (tscArgs, disabledProjects = []) => {
      return new Promise((resolve, reject) => {
        glob('**/tsconfig.json', { ignore: '**/node_modules/**' }, (error: Error | null, tsConfigFiles: string[]) => {
          if (error) {
            reject(error);
          }
          tsConfigFiles.filter(file => {
            return !disabledProjects.includes(file.split('/')[0]);
          }).forEach(file => {
            let args = ['-p', file];
            let taskFunction = (callback: TaskFunctionCallback) => {
              let task = taskRunner.runTask('./node_modules/.bin/tsc', args, {
                name: `tsc -p ${file}`,
                logger,
                handleOutput
              });
              runningTasks.push(task);
              task.result.then(() => {
                runningTasks.splice(runningTasks.indexOf(task), 1);
              }).then(callback).catch(reject);
            };

            taskFunctions.push(taskFunction);
          });

          let limit = 2;
          parallelLimit(taskFunctions, limit, resolve);
        });
      });
    },
    start: () => {
      const tsConfigFiles = ['./tsconfig.json', './src/tsconfig.json']; // Watching all **/tsconfig.json files has proven to cost too much CPU
      tsConfigFiles.forEach(tsconfigFile => {
        if (fs.existsSync(tsconfigFile)) {
          let task = taskRunner.runTask('./node_modules/.bin/tsc', ['-p', tsconfigFile, '--watch', '--noEmit', '--preserveWatchOutput'], {
            name: `tsc -p ${tsconfigFile} --watch`,
            logger,
            handleOutput
          });
          runningTasks.push(task);
          busyCompilers++;
          task.result.catch(err => {
            logger.error('compiler', err.message);
            process.exit(1);
          });
        }
      });
    },
    stop: () => {
      runningTasks.forEach(task => {
        task.kill();
      });
      runningTasks = [];
    }
  };
}
