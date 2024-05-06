import { spawn } from "child_process";
import * as path from "path";
import { createInterface } from "readline";

import * as kill from "tree-kill";

import { Logger } from "./logger";

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

function strip(line: string) {
  return /^\s*(.*?)\s*$/m.exec(line)![1];
}

export function createDefaultTaskRunner(): TaskRunner {
  return {
    runTask(command: string, args: string[], config: TaskConfig) {
      let start = performance.now();
      let loggerCategory = config.name;
      let logger = config.logger;

      let readableCommand = command
        .replace(`.${path.sep}node_modules${path.sep}.bin${path.sep}`, "")
        .replace(".cmd", "");

      logger.log(
        loggerCategory,
        `running command ${readableCommand} ${args.join(" ")}`
      );
      let task = spawn(command, args, { shell: true });

      let stdout = createInterface({ input: task.stdout });
      stdout.on("line", (line) => {
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
      stderr.on("line", (line) => {
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
        task.on("close", (code: number) => {
          let end = performance.now();
          let elapsedTime = (end - start) / 1000;
          logger.log(
            loggerCategory,
            `command ${readableCommand} ${args.join(
              " "
            )} took ${elapsedTime.toFixed(1)}s`
          );

          if (code === 0 || code === null) {
            resolve();
          } else {
            reject(`Process exited with code ${code}`);
          }
        });
      });

      return {
        result,
        kill() {
          kill(task.pid!);
        },
      };
    },
  };
}

export let createWindowsTaskRunner = (): TaskRunner => {
  let delegate = createDefaultTaskRunner();
  let translateToWindows = (command: string) => {
    if (command.charAt(0) === ".") {
      // we just assume it is something from the ./node_modules/.bin/ folder
      command += ".cmd";
    }
    return command.replace(/\//g, "\\");
  };
  return {
    runTask: (command: string, args: string[], config: TaskConfig) => {
      return delegate.runTask(translateToWindows(command), args, config);
    },
  };
};
