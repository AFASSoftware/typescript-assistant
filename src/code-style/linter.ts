import { Bus, EventType } from '../bus';
import { Git } from '../git';
import { Logger } from '../logger';
import { TaskRunner } from '../taskrunner';
import { absolutePath, isTypescriptFile } from '../util';
import { ChildProcess, fork } from 'child_process';

export interface Linter {
  start(trigger: EventType): void;
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
  violation?: {
    fileName: string;
    message: string;
    line: number;
    column: number;
    hasFix: boolean;
  };
  finished?: {
    success: boolean;
  };
}

export let createLinter = (dependencies: { taskRunner: TaskRunner, logger: Logger, bus: Bus, git: Git }): Linter => {
  let { logger, bus, git } = dependencies;

  let logError = (err: any) => logger.error('linter', `error: ${err}`);

  let lintProcess: ChildProcess | undefined;

  let running = false;
  let rescheduled = false;
  let fix = false;
  let errors = 0;
  let fixable = 0;

  let startLint = async (files?: string[]) => {
    rescheduled = false;
    running = true;
    if (!files) {
      files = (await git.findChangedFiles()).filter(isTypescriptFile);
    }
    logger.log('linter', `Linting ${files.length} files...`);
    errors = 0;
    fixable = 0;
    let command: LinterCommand = {
      fix: fix,
      filesToLint: files
    };
    lintProcess!.send!(command);
  };

  let lint = (files?: string[]) => {
    if (rescheduled) {
      return;
    } else if (running) {
      rescheduled = true;
    } else {
      startLint(files).catch(logError);
    }
  };

  let startProcess = () => {
    lintProcess = fork(`${__dirname}/linter-process`, [], {});
    lintProcess.on('close', (code: number) => {
      if (code !== 0 && code !== null) {
        logger.log('linter', `linting process exited with code ${code}`);
      }
    });
    lintProcess.on('message', (response: LinterResponse) => {
      if (response.violation) {
        let { fileName, line, column, message, hasFix } = response.violation;
        errors++;
        if (hasFix) {
          fixable++;
        }
        logger.log('linter', `${absolutePath(fileName)}:${line}:${column} ${message}`);
      }
      if (response.finished) {
        running = false;
        logger.log('linter', response.finished.success
          ? 'All files are ok'
          : `${errors} Linting problems found, ${fixable} ${fix ? 'fixed' : 'fixable'}`);
        bus.signal(response.finished.success ? 'lint-linted' : 'lint-errored');
        if (rescheduled) {
          startLint().catch(logError);
        }
      }
    });
  };

  return {
    start: (trigger: EventType) => {
      startProcess();
      bus.register(trigger, lint);
    },
    stop: () => {
      bus.unregister(lint);
      lintProcess!.kill();
      lintProcess = undefined;
    },
    lintOnce: (fixOnce: boolean, files?: string[]) => {
      fix = fixOnce;
      let isRunning = lintProcess !== undefined;
      if (!isRunning) {
        startProcess();
      }
      return new Promise((resolve) => {
        let ready = () => {
          bus.unregister(linted);
          bus.unregister(errored);
          fix = false;
          if (!isRunning) {
            lintProcess!.kill();
            lintProcess = undefined;
          }
        };
        let linted = () => {
          ready();
          resolve(true);
        };
        let errored = () => {
          ready();
          resolve(false);
        };
        bus.register('lint-linted', linted);
        bus.register('lint-errored', errored);
        lint(files);
      });
    }
  };
};
