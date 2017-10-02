/* tslint:disable no-null-keyword */
import { Bus, EventType } from '../bus';
import { Git } from '../git';
import { Logger } from '../logger';
import { absolutePath, isTypescriptFile } from '../util';

import { Options, processFiles, ResultMap } from 'typescript-formatter';

let replaceOptions: Options = {
  replace: true,
  verbose: false,
  baseDir: process.cwd(),
  editorconfig: true,
  tslint: true,
  tsfmt: true,
  verify: false,
  tsconfig: false,
  tsconfigFile: null,
  tslintFile: null,
  tsfmtFile: null,
  vscode: false
};

let verifyOptions: Options = {
  replace: false,
  verbose: false,
  baseDir: process.cwd(),
  editorconfig: true,
  tslint: true,
  tsfmt: true,
  verify: true,
  tsconfig: false,
  tsconfigFile: null,
  tslintFile: null,
  tsfmtFile: null,
  vscode: false
};

export interface Formatter {
  formatFiles(files: string[]): Promise<boolean>;
  verifyFiles(files: string[]): Promise<boolean>;
  startVerifying(triggers: EventType[]): void;
  stopVerifying(): void;
}

export let createFormatter = (dependencies: { logger: Logger, git: Git, bus: Bus }): Formatter => {
  let { logger, bus, git } = dependencies;

  let runningFormatter: Promise<void> | undefined;
  let rescheduled = false;

  let logError = (err: any) => logger.error('formatter', `error: ${err}`);

  let runFormatterOn = (files: string[], options: Options): Promise<boolean> => {
    logger.log('formatter', `checking ${files.length} files...`);
    return processFiles(files, options).then((resultMap: ResultMap) => {
      let success = true;
      Object.keys(resultMap).forEach((fileName: string) => {
        let result = resultMap[fileName];
        if (result.error) {
          success = false;
        }
        if (result.message) {
          logger.log('formatter', `${options.replace ? 'Fixed ' : ''}${absolutePath(fileName)}: ${result.message}`);
        }
      });
      return success;
    });
  };

  let runFormatter = (options: Options) => {
    return git.findChangedFiles().then((files: string[]) => {
      files = files.filter(isTypescriptFile);
      return runFormatterOn(files, options);
    });
  };

  let verifyFormat = () => {
    if (runningFormatter) {
      rescheduled = true;
    } else {
      runFormatter(verifyOptions).then((success) => {
        logger.log('formatter', success ? 'all files formatted' : 'unformatted files found');
        bus.signal(success ? 'format-verified' : 'format-errored');
      }).catch(logError).then(() => {
        runningFormatter = undefined;
        if (rescheduled) {
          rescheduled = false;
          verifyFormat();
        }
      }).catch(logError);
    }
  };

  return {
    verifyFiles: (files) => {
      return runFormatterOn(files, verifyOptions);
    },
    formatFiles: (files) => {
      return runFormatterOn(files, replaceOptions);
    },
    startVerifying: (triggers: EventType[]) => {
      bus.registerAll(triggers, verifyFormat);
      verifyFormat();
    },
    stopVerifying: () => {
      bus.unregister(verifyFormat);
    }
  };
};
