import {spawn} from 'child_process';
import {Logger} from './logger';

export interface Task {
  kill(): void;
}

export interface TaskConfig {
  name: string;
  logger: Logger;
  handleOutput?(line: string): boolean;
  handleError?(line: string): boolean;
  handleClose?(code: number): boolean;
}

/**
 * Used for differences between windows and linux and it can also be mocked for unit tests
 */
export interface TaskRunner {
  runTask(command: string, args: string[], config: TaskConfig): Task;
};

let trim = (data: string) => {
  if (!data) {
    return undefined;
  }
  let matches = /^\s*(.*?)\s*$/.exec(data);
  return matches ? matches[1] : undefined;
};

export let createDefaultTaskRunner = (): TaskRunner => {
  return {
    runTask: (command: string, args: string[], config: TaskConfig) => {
      let loggerCategory = config.name;
      let logger = config.logger;

      logger.log(loggerCategory, `running command ${command} ${args.join(' ')}`);
      let task = spawn(command, args);

      task.stdout.on('data', (data: string) => {
        data = trim(data);
        if (!data || data.length === 0) { return; }
        let handled = false;
        if (config.handleOutput) {
          handled = config.handleOutput(data);
        }
        if (!handled) {
          logger.log(loggerCategory, data);
        }
      });

      task.stderr.on('data', (data: string) => {
        data = trim(data);
        if (!data) { return; }
        let handled = false;
        if (config.handleOutput) {
          handled = config.handleOutput(data);
        }
        if (!handled) {
          logger.error(loggerCategory, data);
        }
      });

      task.on('close', (code: number) => {
        let handled = false;
        if (config.handleClose) {
          handled = config.handleClose(code);
        }
        if (!handled) {
          logger.quit(loggerCategory);
        }
      });

      return {
        kill: () => {
          task.kill();
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
