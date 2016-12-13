import { Logger } from '../logger';
import { Bus, EventType } from '../bus';
import { TaskRunner } from '../taskrunner';
import { Git } from '../git';
import { absolutePath, isTypescriptFile } from '../util';

import { fork, ChildProcess } from 'child_process';

export interface Linter {
  start(trigger: EventType): void;
  stop(): void;
};

/**
 * The messages that are sent to the linter-process
 */
export interface LinterCommand {
  filesToLint: string[];
}

export interface LinterResponse {
  violation?: {
    fileName: string;
    message: string;
    line: number;
    column: number;
  };
  finished?: {
    success: boolean;
  };
}

export let createLinter = (config: { taskRunner: TaskRunner, logger: Logger, bus: Bus, git: Git }) => {
  let {logger, bus, git} = config;
  let lintProcess: ChildProcess;

  let running = false;
  let rescheduled = false;

  let startLint = () => {
    rescheduled = false;
    running = true;
    git.findChangedFiles().then((files) => {
      files = files.filter(isTypescriptFile);
      logger.log('linter', `Linting ${files.length} files...`);
      let command: LinterCommand = {
        filesToLint: files
      };
      lintProcess.send(command);
    });
  };

  let lint = () => {
    if (rescheduled) {
      return;
    } else if (running) {
      rescheduled = true;
    } else {
      startLint();
    }
  };

  return {
    start: (trigger: EventType) => {
      lintProcess = fork(__dirname + '/linter-process', [], {});
      lintProcess.on('close', (code: number) => {
        logger.log('linter', 'linting process exited with code ' + code);
      });
      lintProcess.on('message', (response: LinterResponse) => {
        if (response.violation) {
          let {fileName, line, column, message} = response.violation;
          logger.log('linter', `${absolutePath(fileName)}:${line}:${column} ${message}`);
        }
        if (response.finished) {
          running = false;
          logger.log('linter', response.finished.success ? 'All files are ok' : 'Linting problems found');
          bus.signal(response.finished.success ? 'lint-linted' : 'lint-errored');
          if (rescheduled) {
            startLint();
          }
        }
      });
      bus.register(trigger, lint);
    },
    stop: () => {
      bus.unregister(lint);
      lintProcess.kill();
      lintProcess = undefined;
    }
  };
};
