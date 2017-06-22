// pre-commit makes sure the changed code is formatted and linted.
//
// Rationale:
// - Fixing formatting and linting errors are always fast and easy to fix.
// - This prevents over-complicated merge conflicts
// - This prevents small formatting/linting fix commits

import { filterTsFiles, findChangedFiles } from '../helpers';
import * as tsfmt from 'typescript-formatter';
import { ResultMap } from 'typescript-formatter';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as glob from 'glob';
import { Bus } from '../bus';
import { Linter } from '../code-style/linter';
import { Logger } from '../logger';

export interface PostCheckoutDependencies {
  logger: Logger;
  bus: Bus;
  linter: Linter;
}

export let createPreCommitCommand = (deps: PostCheckoutDependencies) => {
  let { logger, linter } = deps;
  return {
    execute: () => {
      let allTsFiles = () => {
        let tsConfig = JSON.parse(readFileSync(join(process.cwd(), 'tsconfig.json'), 'UTF-8'));
        let globs: string[] = tsConfig && tsConfig.include ? tsConfig.include : ['src/**/*.ts', 'test/**/*.ts'];
        let files: string[] = [];
        globs.forEach(g => glob.sync(g).forEach(file => files.push(file)));
        return files;
      };

      let changed = findChangedFiles();
      let files = changed.length === 0 ? allTsFiles() : filterTsFiles(changed);

      let lintFiles = () => {
        return linter.lintOnce(false);
      };

      return tsfmt.processFiles(files, {
        verify: true, replace: false, verbose: false, baseDir: process.cwd(), editorconfig: true, tslint: true, tsfmt: true, tsconfig: true,
        tsconfigFile: undefined, tslintFile: undefined, tsfmtFile: undefined, vscode: false
      }).then(async (resultList: ResultMap) => {
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
          throw new Error(`The following files were not formatted:\r\n  ${unformattedFiles.join('\r\n  ')}`);
        }
      });
    }
  };
};
