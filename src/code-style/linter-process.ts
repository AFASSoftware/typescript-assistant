/* Runs in a separate process and communicates using process.on('message', ...) */
/* This is because tslint is implemented synchronously */
import { readFileSync } from 'fs';
import { ILinterOptions, Linter, RuleFailure } from 'tslint';
import { IConfigurationFile } from 'tslint/lib/configuration';
import { LinterCommand, LinterResponse } from './linter';

let { rules, rulesDirectory } = Linter.loadConfigurationFromPath(`${process.cwd()}/tslint.json`);

let configuration: IConfigurationFile = {
  rules: rules,
  rulesDirectory: rulesDirectory,
  jsRules: undefined,
  defaultSeverity: 'error',
  extends: [],
  linterOptions: {
    typeCheck: true
  }
};

const options: ILinterOptions = {
  fix: false,
  formatter: 'prose'
};

process.on('message', (msg: LinterCommand) => {
  let success = true;
  let program = Linter.createProgram(`${process.cwd()}/tslint.json`);
  let linter = new Linter(options, program);

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
