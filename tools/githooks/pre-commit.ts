// pre-commit makes sure the changed code is formatted and linted.
//
// Rationale:
// - Fixing formatting and linting errors are always fast and easy to fix.
// - This prevents over-complicated merge conflicts
// - This prevents small formatting/linting fix commits

import { filterTsFiles, findChangedFiles } from '../helpers/helpers';
import * as tsfmt from 'typescript-formatter';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as glob from 'glob';
import { Linter, RuleFailure } from 'tslint';
import { IConfigurationFile } from 'tslint/lib/configuration';
import { absolutePath } from '../../src/util';

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
  let linter = new Linter({ fix: false, formatter: 'prose' });
  let configurationFile = Linter.loadConfigurationFromPath(process.cwd() + '/tslint.json');
  let configuration: IConfigurationFile = {
    rules: configurationFile.rules,
    rulesDirectory: configurationFile.rulesDirectory
  };
  let success = true;
  files.forEach((fileName) => {
    let contents = readFileSync(fileName, 'utf8');
    linter.lint(fileName, contents, configuration);

    let results = linter.getResult();
    results.failures.forEach((failure: RuleFailure) => {
      success = false;
      let line = failure.getStartPosition().getLineAndCharacter().line + 1;
      let column = failure.getStartPosition().getLineAndCharacter().character;
      console.log(`${absolutePath(fileName)}:${line}:${column} ${failure.getFailure()}`);
    });
  });
  return success;
};

tsfmt.processFiles(files, {
  verify: true, replace: false, verbose: false, baseDir: process.cwd(), editorconfig: true, tslint: true, tsfmt: true, tsconfig: true
}).then((resultList) => {
  let unformattedFiles: string[] = [];
  Object.keys(resultList).forEach((key) => {
    let result = resultList[key];
    if (result.error) {
      unformattedFiles.push(result.fileName);
    }
  });
  if (unformattedFiles.length === 0) {
    console.log(`All ${files.length} files were formatted`);
    if (lintFiles()) {
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
