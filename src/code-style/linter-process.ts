/* Runs in a separate process and communicates using process.on('message', ...) */
/* This is because tslint is implemented synchronously */

import { LinterCommand, LinterResponse } from './linter';
import { readFileSync } from 'fs';
import { RuleFailure } from 'tslint';
import { IConfigurationFile } from 'tslint/lib/configuration';
const Linter = require('tslint');

// let program = Linter.createProgram(process.cwd() + '/tslint.json');

let configurationFile = Linter.loadConfigurationFromPath(process.cwd() + '/tslint.json');

let options: IConfigurationFile = {
  jsRules: configurationFile.jsRules,
  // configuration: { rules: configurationFile.rules },
  // formatter: 'prose',
  // formattersDirectory: undefined as string,
  rulesDirectory: configurationFile.rulesDirectory
};

process.on('message', (msg: LinterCommand) => {
  let success = true;
  msg.filesToLint.forEach((fileName) => {
    let contents = readFileSync(fileName, 'utf8');
    let linter = new Linter(fileName, contents, options);
    let results = linter.lint();
    results.failures.forEach((failure: RuleFailure) => {
      success = false;
      let response = {
        violation: {
          fileName,
          line: failure.getStartPosition().getLineAndCharacter().line + 1,
          column: failure.getStartPosition().getLineAndCharacter().character,
          message: failure.getFailure()
        }
      } as LinterResponse;
      process.send(response);
    });
  });
  process.send({ finished: { success } } as LinterResponse);
});
