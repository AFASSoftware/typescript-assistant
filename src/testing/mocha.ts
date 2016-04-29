import {Logger} from '../logger';
import {Bus, EventType} from '../bus';
import {TaskRunner} from '../taskrunner';
import {Git} from '../git';
import {Configuration} from '../configuration';
import {absolutePath, isTypescriptFile} from '../util';

import {fork, ChildProcess} from 'child_process';

export interface Mocha {
  start(trigger: EventType): void;
  stop(): void;
};

/**
 * The messages that are sent to mocha-process
 */
export interface MochaCommand {
  testFiles: string[];
}

export interface MochaResponse {
  testResult?: {
    title: string;
    fileName: string;
    error?: string;
    stack?: string;
  };
  finished?: {
    success: boolean;
  };
}

let relevantStackPart = (stack: string) => {
  let lines = stack.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('node_modules\\mocha') !== -1) {
      return lines.slice(0, i).join('\n');
    }
  }
  return stack;
};

export let createMocha = (config: { taskRunner: TaskRunner, logger: Logger, bus: Bus, git: Git, configuration: Configuration }) => {
  let {logger, bus, configuration} = config;

  let startMochaProcess = (): ChildProcess => {
    let mochaProcess = fork(__dirname + '/mocha-process', [], {});
    mochaProcess.on('close', (code: number) => {
      if (code) {
        logger.log('mocha', 'mocha process exited with code ' + code);
      }
    });
    mochaProcess.on('message', (response: MochaResponse) => {
      if (response.testResult) {
        let {fileName, title, error, stack} = response.testResult;
        if (error) {
          logger.log('mocha', `Test failed: ${fileName} ${title}`);
          logger.log('mocha', relevantStackPart(stack));
        }
      }
      if (response.finished) {
        logger.log('mocha', response.finished.success ? 'All tests pass' : 'There were test failures');
      }
    });
    return mochaProcess;
  };

  let startMocha = () => {
    configuration.findCompiledTestFiles().then((files) => {
      logger.log('mocha', `Testing ${files.length} files...`);
      let command: MochaCommand = {
        testFiles: files
      };
      startMochaProcess().send(command);
    });
  };

  return {
    start: (trigger: EventType) => {
      bus.register(trigger, startMocha);
    },
    stop: () => {
      bus.unregister(startMocha);
    }
  };
};
