// pre-commit makes sure the changed code is formatted and linted.
//
// Rationale:
// - Fixing formatting and linting errors are always fast and easy to fix.
// - This prevents over-complicated merge conflicts
// - This prevents small formatting/linting fix commits

import { filterTsFiles, findChangedFiles } from '../helpers/helpers';
import * as tsfmt from 'typescript-formatter';
import { ResultMap } from 'typescript-formatter';
import { readFileSync } from 'fs';
import { join, sep } from 'path';
import * as glob from 'glob';
import { Linter, RuleFailure } from 'tslint';
import { IConfigurationFile } from 'tslint/lib/configuration';
import { absolutePath } from '../../src/util';
import { createBus } from '../../src/bus';
import { createLinter } from '../../src/code-style/linter';
import { createDefaultTaskRunner, createWindowsTaskRunner } from '../../src/taskrunner';
import { createConsoleLogger } from '../../src/logger';
import { createGit } from '../../src/git';

/* tslint:disable:no-console */

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
  let logger = createConsoleLogger();
  let taskRunner = sep === '\\' ? createWindowsTaskRunner() : createDefaultTaskRunner();
  let bus = createBus();
  let git = createGit({ taskRunner, logger });
  let linter = createLinter({
    taskRunner, logger, bus, git
  });
  return linter.lintOnce(false);
};

tsfmt.processFiles(files, {
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
    console.log(`All ${files.length} files were formatted`);
    if (await lintFiles()) {
      console.log(`All ${files.length} files were linted`);
      process.exit(0);
    } else {
      console.log(`There were linting errors`);
      process.exit(1);
    }
  } else {
    console.error(`The following files were not formatted:\r\n  ${unformattedFiles.join('\r\n  ')}`);
    process.exit(1);
  }
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
