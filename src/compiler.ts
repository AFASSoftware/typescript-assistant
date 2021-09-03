import * as fs from "fs";

import { parallelLimit } from "async";
import { glob } from "glob";

import { Bus } from "./bus";
import { Logger } from "./logger";
import { Task, TaskRunner } from "./taskrunner";
import { absolutePath } from "./util";

export interface Compiler {
  start(configs?: string[]): void;
  stop(): void;
  runOnce(tscArgs: string[], disabledProjects?: string[]): Promise<boolean>;
}

type TaskFunctionCallback = () => void;
type TaskFunction = (callback: TaskFunctionCallback) => void;

let runningTasks: Task[] = [];

export function createCompiler(dependencies: {
  taskRunner: TaskRunner;
  logger: Logger;
  bus: Bus;
}): Compiler {
  const { taskRunner, logger, bus } = dependencies;

  let busyCompilers = 0;
  let errors: string[] = [];

  function handleOutput(line: string) {
    if (/Starting incremental compilation...$/.test(line)) {
      if (busyCompilers === 0) {
        bus.report({ tool: "compiler", status: "busy" });
        errors = [];
      }
      busyCompilers++;
      logger.log("compiler", "compiling...");
      bus.signal("compile-started");
    } else if (/Watching for file changes.$/.test(line)) {
      busyCompilers--;
      logger.log("compiler", `ready, found ${errors.length} errors`);
      bus.signal(errors.length === 0 ? "compile-compiled" : "compile-errored");
      if (busyCompilers === 0) {
        bus.report({
          tool: "compiler",
          status: "ready",
          errors: errors.length,
        });
      }
    } else {
      let matches = /([^(]+)\((\d+),(\d+)\): (error TS\d+: )?(.*)$/.exec(line);
      if (matches) {
        errors.push(matches[0]);
        logger.log(
          "compiler",
          `${absolutePath(matches[1])}:${matches[2]}:${matches[3]} ${
            matches[5]
          }`
        );
      } else {
        matches = /error TS\d+: (.+)$/.exec(line);
        if (matches) {
          errors.push(matches[1]);
          logger.log("compiler", `${matches[1]}`);
        } else {
          // just echo the output
          logger.log("compiler", line);
        }
      }
    }
    return true;
  }

  let taskFunctions: TaskFunction[] = [];

  return {
    runOnce(tscArgs, disabledProjects = []) {
      return new Promise((resolve, reject) => {
        glob(
          "**/tsconfig.json",
          { ignore: "**/node_modules/**" },
          (error: Error | null, tsConfigFiles: string[]) => {
            if (error) {
              reject(error);
            }

            tsConfigFiles
              .filter((file) => {
                return !disabledProjects.includes(file.split("/")[0]);
              })
              .forEach((file) => {
                let args = ["--build", file];
                let taskFunction = (callback: TaskFunctionCallback) => {
                  let task = taskRunner.runTask(
                    "./node_modules/.bin/tsc",
                    args,
                    {
                      name: `tsc --build ${file}`,
                      logger,
                      handleOutput,
                    }
                  );
                  runningTasks.push(task);
                  task.result
                    .then(() => {
                      runningTasks.splice(runningTasks.indexOf(task), 1);
                    })
                    .then(callback)
                    .catch(reject);
                };

                taskFunctions.push(taskFunction);
              });

            let limit = 2;
            parallelLimit(taskFunctions, limit, resolve);
          }
        );
      });
    },
    /**
     * Watching all tsconfig.json files has proven to cost too much CPU.
     */
    start(tsConfigFiles = ["./tsconfig.json", "./src/tsconfig.json"]) {
      tsConfigFiles = tsConfigFiles.map((config) =>
        config.replace(/\\\\/g, "/")
      );

      tsConfigFiles.forEach((tsconfigFile) => {
        if (!fs.existsSync(tsconfigFile)) {
          throw new Error(`File does not exist: ${tsconfigFile}`);
        }
      });

      let task = taskRunner.runTask(
        "./node_modules/.bin/tsc",
        ["-b", ...tsConfigFiles, "--watch", "--preserveWatchOutput"],
        {
          name: `tsc --build ${tsConfigFiles.join(" ")} --watch`,
          logger,
          handleOutput,
        }
      );
      runningTasks.push(task);
      busyCompilers++;
      task.result.catch((err) => {
        logger.error("compiler", err.message);
        process.exit(1);
      });
    },
    stop() {
      runningTasks.forEach((task) => {
        task.kill();
      });
      runningTasks = [];
    },
  };
}
