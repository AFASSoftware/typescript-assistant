/* Runs in a separate process and communicates using process.on('message', ...) */
/* This is because tslint is implemented synchronously */
import { readFileSync } from 'fs';
import { ILinterOptions, Linter, RuleFailure } from 'tslint';
import { IConfigurationFile } from 'tslint/lib/configuration';
import { LinterCommand, LinterResponse } from './linter';

let configurationFile = Linter.loadConfigurationFromPath(process.cwd() + '/tslint.json');

let configuration: IConfigurationFile = {
  rules: configurationFile.rules,
  rulesDirectory: configurationFile.rulesDirectory
};

const options: ILinterOptions = {
  fix: false,
  formatter: 'prose'
};

process.on('message', (msg: LinterCommand) => {
  let success = true;
  let linter = new Linter(options);

  msg.filesToLint.forEach((fileName) => {
    let contents = readFileSync(fileName, 'utf8');
    linter.lint(fileName, contents, configuration);

    let results = linter.getResult();
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
