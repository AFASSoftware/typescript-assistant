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
  jsRules: new Map(),
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

const fixOptions: ILinterOptions = {
  fix: true,
  formatter: 'prose'
};

process.on('message', (msg: LinterCommand) => {
  let success = true;
  let program = Linter.createProgram(`${process.cwd()}/tslint.json`);

  msg.filesToLint.forEach((fileName) => {
    let linter = new Linter(msg.fix ? fixOptions : options, program);
    let contents = readFileSync(fileName, 'utf8');
    linter.lint(fileName, contents, configuration);
    let results = linter.getResult();
    results.failures.forEach((failure: RuleFailure) => {
      success = false;
      let line: number = failure.getStartPosition().getLineAndCharacter().line;
      let column = failure.getStartPosition().getLineAndCharacter().character;
      let response: LinterResponse = {
        violation: {
          fileName,
          line: line + 1,
          column: column,
          message: failure.getFailure(),
          hasFix: failure.hasFix()
        }
      };
      process.send!(response);
    });
  });
  process.send!({ finished: { success } } as LinterResponse);
});
