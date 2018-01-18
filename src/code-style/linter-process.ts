/* Runs in a separate process and communicates using process.on('message', ...) */
/* This is because tslint is implemented synchronously */
import { readFileSync } from 'fs';
import { ILinterOptions, Linter, RuleFailure } from 'tslint';
import { IConfigurationFile } from 'tslint/lib/configuration';
import { LinterCommand, LinterResponse } from './linter';
import * as glob from 'glob';
import { Program } from 'typescript';

let { rules, rulesDirectory } = Linter.loadConfigurationFromPath(`${process.cwd()}/tslint.json`);

let configuration: IConfigurationFile = {
  rules: rules,
  rulesDirectory: rulesDirectory,
  jsRules: new Map(),
  defaultSeverity: 'error',
  extends: []
};

const options: ILinterOptions = {
  fix: false,
  formatter: 'prose'
};

const fixOptions: ILinterOptions = {
  fix: true,
  formatter: 'prose'
};

interface TsConfigMatch {
  match: RegExp;
  config: string;
}

process.on('message', (msg: LinterCommand) => {
  let success = true;

  let configPaths = glob.sync('**/tsconfig.json', { ignore: '**/node_modules/**' })
    .sort((a, b) => b.split('/').length - a.split('/').length);

  let configs: TsConfigMatch[] = configPaths.map(path => ({
    match: new RegExp(`^${path.replace('tsconfig.json', '.*')}`),
    config: `${process.cwd()}/${path}`
  }));

  let currentConfig: TsConfigMatch;
  let currentProgram: Program;

  msg.filesToLint.forEach((fileName) => {
    let config = configs.find(({ match }) => match.test(fileName));
    if (!config) {
      process.send!(<LinterResponse>{
        error: {
          message: `Could not find tsconfig.json for file ${fileName}`
        }
      });
      return;
    }

    if (config !== currentConfig) {
      currentConfig = config;
      // Programs can't be stored in the config, it will cause an out of memory error when keeping all the programs.
      currentProgram = Linter.createProgram(config.config);
    }

    let linter = new Linter(msg.fix ? fixOptions : options, currentProgram);
    let contents = readFileSync(fileName, 'utf8');
    try {
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
    } catch (e) {
      process.send!(<LinterResponse>{
        error: {
          message: e.message
        }
      });
    }
  });
  process.send!({ finished: { success } } as LinterResponse);
});
