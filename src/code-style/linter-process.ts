/* Runs in a separate process and communicates using process.on('message', ...) */
/* This is because tslint is implemented synchronously */

import * as Linter from 'tslint';
import {LinterCommand, LinterResponse} from './linter';
import {readFileSync} from 'fs';

let options = {
  configuration: undefined as any,
  formatter: 'prose',
  formattersDirectory: undefined as string,
  rulesDirectory: undefined as string | string[]
};

process.on('message', (msg: LinterCommand) => {
  let success = true;
  msg.filesToLint.forEach((fileName) => {
    let contents = readFileSync(fileName, 'utf8');
    let linter = new Linter(fileName, contents, options);
    let results = linter.lint();
    results.failures.forEach((failure) => {
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

let configurationFile = Linter.loadConfigurationFromPath(process.cwd() + '/tslint.json');

options.configuration = { rules: configurationFile.rules };
options.rulesDirectory = configurationFile.rulesDirectory;
