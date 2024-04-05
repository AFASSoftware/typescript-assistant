import { ChildProcess, fork } from "child_process";

import { Bus, EventType } from "../bus";
import { Git } from "../git";
import { Logger } from "../logger";
import { TaskRunner } from "../taskrunner";
import { isTypescriptFile } from "../util";

export interface Linter {
  start(trigger: EventType, coldStart?: boolean): void;
  stop(): void;
  lintOnce(fix: boolean, files?: string[]): Promise<boolean>;
}

/**
 * The messages that are sent to the linter-process
 */
export interface LinterCommand {
  fix: boolean;
  filesToLint: string[];
}

export interface LinterResponse {
  summary?: {
    message: string;
    errorCount: number;
    warningCount: number;
    fixableCount: number;
    fixCount: number;
  };
  finished?: {
    success: boolean;
  };
  error?: {
    message: string;
  };
}

export function createLinter(dependencies: {
  taskRunner: TaskRunner;
  logger: Logger;
  bus: Bus;
  git: Git;
}): Linter {
  const { logger, bus, git } = dependencies;

  let logError = (err: any) => logger.error("linter", `error: ${err}`);

  let lintProcess: ChildProcess | undefined;

  let running = false;
  let rescheduled = false;
  let fix = false;
  let errors = 0;
  let fixable = 0;

  let startLint = async (files?: string[]) => {
    rescheduled = false;
    running = true;
    bus.report({
      tool: "lint",
      status: "busy",
    });
    if (!files) {
      files = (await git.findChangedFiles()).filter(isTypescriptFile);
    }
    logger.log("linter", `Linting ${files.length} files...`);
    errors = 0;
    fixable = 0;
    let command: LinterCommand = {
      fix: fix,
      filesToLint: files,
    };
    lintProcess!.send(command);
  };

  function lint(files?: string[]) {
    if (rescheduled) {
      return;
    } else if (running) {
      rescheduled = true;
    } else {
      startLint(files).catch(logError);
    }
  }

  function startProcess() {
    lintProcess = fork(`${__dirname}/linter-process-eslint`, [], {
      execArgv: process.execArgv.filter((arg) => !arg.includes("inspect")),
    });
    lintProcess.on("close", (code: number) => {
      if (code !== 0 && code !== null) {
        logger.log("linter", `linting process exited with code ${code}`);
      }
    });
    lintProcess.on("message", (response: LinterResponse) => {
      if (response.summary) {
        let { message, errorCount, warningCount, fixableCount, fixCount } =
          response.summary;
        if (fixCount > 0) {
          logger.log("linter", `Fixed ${fixCount} files`);
        }
        if (message) {
          logger.log("linter", message);
        }
        errors = errorCount + warningCount;
        fixable = fixableCount;
      }
      if (response.finished) {
        running = false;
        logger.log(
          "linter",
          response.finished.success && errors === 0
            ? "All files are ok"
            : `${errors} Linting problems found, ${fixable} ${
                fix ? "fixed" : "fixable"
              }`
        );
        bus.signal(
          response.finished.success && errors === 0
            ? "lint-linted"
            : "lint-errored"
        );
        bus.report({
          tool: "lint",
          status: "ready",
          errors: errors,
          fixable: fixable,
        });
        if (rescheduled) {
          startLint().catch(logError);
        }
      }
      if (response.error) {
        logger.error("linter", response.error.message);
      }
    });
  }

  let lintCallback = () => lint();

  return {
    start(trigger: EventType, coldStart = false) {
      startProcess();
      bus.register(trigger, lintCallback);
      if (coldStart) {
        lintCallback();
      }
    },
    stop() {
      bus.unregister(lintCallback);
      lintProcess!.kill();
      lintProcess = undefined;
    },
    lintOnce(fixOnce: boolean, files?: string[]) {
      fix = fixOnce;
      let isRunning = lintProcess !== undefined;
      if (!isRunning) {
        startProcess();
      }
      return new Promise((resolve) => {
        function ready() {
          bus.unregister(linted);
          bus.unregister(errored);
          fix = false;
          if (!isRunning) {
            lintProcess!.kill();
            lintProcess = undefined;
          }
        }

        function linted() {
          ready();
          resolve(true);
        }

        function errored() {
          ready();
          resolve(false);
        }

        bus.register("lint-linted", linted);
        bus.register("lint-errored", errored);
        lint(files);
      });
    },
  };
}
