import { spawn } from 'child_process';
import { Logger } from './logger';
import { createInterface } from 'readline';
import * as kill from 'tree-kill';

export interface Task {
  result: Promise<void>;
  kill(): void;
}

export interface TaskConfig {
  name: string;
  logger: Logger;
  handleOutput?(line: string): boolean;
  handleError?(line: string): boolean;
}

/**
 * Used for differences between windows and linux and it can also be mocked for unit tests
 */
export interface TaskRunner {
  runTask(command: string, args: string[], config: TaskConfig): Task;
}

let strip = (line: string) => /^\s*(.*?)\s*$/m.exec(line)![1];

export let createDefaultTaskRunner = (): TaskRunner => {
  return {
    runTask: (command: string, args: string[], config: TaskConfig) => {
      let loggerCategory = config.name;
      let logger = config.logger;

      logger.log(loggerCategory, `running command ${command} ${args.join(' ')}`);
      let task = spawn(command, args);

      let stdout = createInterface({ input: task.stdout });
      stdout.on('line', line => {
        line = strip(line);
        if (!line) {
          return;
        }
        let handled = false;
        if (config.handleOutput) {
          handled = config.handleOutput(line);
        }
        if (!handled) {
          logger.log(loggerCategory, line);
        }
      });

      let stderr = createInterface({ input: task.stderr });
      stderr.on('line', line => {
        line = strip(line);
        if (!line) {
          return;
        }
        let handled = false;
        if (config.handleError) {
          handled = config.handleError(line);
        }
        if (!handled) {
          logger.error(loggerCategory, line);
        }
      });

      let result = new Promise<void>((resolve, reject) => {
        task.on('close', (code: number) => {
          if (code === 0 || code === null) {
            resolve();
          } else {
            reject(`Process exited with code ${code}`);
          }
        });
      });

      return {
        result,
        kill: () => {
          kill(task.pid);
        }
      };
    }
  };
};

export let createWindowsTaskRunner = (): TaskRunner => {
  let delegate = createDefaultTaskRunner();
  let translateToWindows = (command: string) => {
    if (command.charAt(0) === '.') {
      // we just assume it is something from the ./node_modules/.bin/ folder
      command += '.cmd';
    }
    return command.replace(/\//g, '\\');
  };
  return {
    runTask: (command: string, args: string[], config: TaskConfig) => {
      return delegate.runTask(translateToWindows(command), args, config);
    }
  };
};
