import { Bus, EventType } from '../bus';
import { Git } from '../git';
import { Logger } from '../logger';
import { absolutePath, isTypescriptFile } from '../util';

import { Options, processFiles } from 'typescript-formatter';

let replaceOptions: Options = {
  replace: true,
  verbose: false,
  baseDir: process.cwd(),
  editorconfig: true,
  tslint: true,
  tsfmt: true,
  verify: false,
  tsconfig: undefined
};

let verifyOptions: Options = {
  replace: false,
  verbose: false,
  baseDir: process.cwd(),
  editorconfig: true,
  tslint: true,
  tsfmt: true,
  verify: true,
  tsconfig: undefined
};

export interface Formatter {
  format(): Promise<boolean>;
  startVerifying(trigger: EventType): void;
  stopVerifying(): void;
}

export let createFormatter = (dependencies: { logger: Logger, git: Git, bus: Bus }): Formatter => {
  let {logger, bus, git} = dependencies;

  let runFormatter = (options: Options) => {
    return git.findChangedFiles().then(files => {
      files = files.filter(isTypescriptFile);
      logger.log('formatter', `checking ${files.length} files...`);
      return processFiles(files, options).then(resultMap => {
        let success = true;
        Object.keys(resultMap).forEach(fileName => {
          let result = resultMap[fileName];
          if (result.error) {
            success = false;
          }
          if (result.message) {
            logger.log('formatter', `${absolutePath(fileName)}: ${result.message}`);
          }
        });
        return success;
      });
    });
  };

  let verifyFormat = () => {
    // needs re-entrant fix
    return runFormatter(verifyOptions).then((success) => {
      logger.log('formatter', success ? 'all files formatted' : 'unformatted files found');
      bus.signal(success ? 'format-verified' : 'format-errored');
    });
  };

  return {
    format: () => {
      return runFormatter(replaceOptions);
    },
    startVerifying: (trigger: EventType) => {
      bus.register(trigger, verifyFormat);
    },
    stopVerifying: () => {
      bus.unregister(verifyFormat);
    }
  };
};
