import * as glob from 'glob';
import { join } from 'path';
import { readFileSync } from 'fs';

const DEFAULT_CONFIG = {
  testDir: 'test'
};

export interface Configuration {
  findCompiledTestFiles: () => Promise<string[]>;
}

export let createConfiguration = () => {
  // todo load and parse tsa.json5 file if it exists
  let tsaConfig = DEFAULT_CONFIG;
  // tsa will not run without a tsconfig.json file
  /* tslint:disable:no-require-imports */
  let tsConfig = JSON.parse(readFileSync(join(process.cwd(), './tsconfig.json'), 'UTF-8'));
  // let tsConfig = require('./tsconfig.json');

  if (!tsConfig.compilerOptions.outDir) {
    throw new Error('No outdir found in tsconfig.json, please add "outDir": "./build/js" to the compilerOptions');
  }

  let compiledTestFolder = join(tsConfig.compilerOptions.outDir, tsaConfig.testDir);
  return {
    findCompiledTestFiles: () => {
      return new Promise((resolve, reject) => {
        glob(join(compiledTestFolder, '**/*.js'), {}, (error, matches) => {
          if (error) {
            reject(error);
          } else {
            resolve(matches);
          }
        });
      });
    }
  };
};
