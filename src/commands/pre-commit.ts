// pre-commit makes sure the changed code is formatted and linted.
//
// Rationale:
// - Fixing formatting and linting errors are always fast and easy to fix.
// - This prevents over-complicated merge conflicts
// - This prevents small formatting/linting fix commits

/* tslint:disable no-null-keyword */
import * as tsfmt from 'typescript-formatter';
import { Bus } from '../bus';
import { Linter } from '../code-style/linter';
import { Logger } from '../logger';
import { isTypescriptFile } from '../util';
import { Git } from '../git';

export interface PostCheckoutDependencies {
  logger: Logger;
  bus: Bus;
  linter: Linter;
  git: Git;
}

export let createPreCommitCommand = (deps: PostCheckoutDependencies) => {
  let { logger, linter, git } = deps;
  return {
    execute: async () => {
      let files = (await git.findChangedFiles()).filter(isTypescriptFile);

      let lintFiles = () => {
        return linter.lintOnce(false, files);
      };

      return tsfmt.processFiles(files, {
        verify: true, replace: false, verbose: false, baseDir: process.cwd(), editorconfig: true, tslint: true, tsfmt: true, tsconfig: true,
        tsconfigFile: null, tslintFile: null, tsfmtFile: null, vscode: false, vscodeFile: null
      }).then(async (resultList: tsfmt.ResultMap) => {
        let unformattedFiles: string[] = [];
        Object.keys(resultList).forEach((key) => {
          let result = resultList[key];
          if (result.error) {
            unformattedFiles.push(result.fileName);
          }
        });
        if (unformattedFiles.length === 0) {
          logger.log('hooks', `All ${files.length} files were formatted`);
          if (await lintFiles()) {
            logger.log('hooks', `All ${files.length} files were linted`);
            process.exit(0);
          } else {
            logger.log('hooks', `There were linting errors`);
            process.exit(1);
          }
        } else {
          logger.error(
            'hooks',
            `The following files were not formatted:\r\n  ${unformattedFiles.join('\r\n  ')}\r\nHint: this can be fixed by running 'npm run fix'`
          );
          process.exit(1);
        }
      });
    }
  };
};

