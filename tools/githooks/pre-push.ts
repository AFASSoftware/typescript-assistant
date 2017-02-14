// THIS WAS AN EXPERIMENT, BUT IT FAILED, BECAUSE THE COVERAGE IS NOT GETTING REPORTED (0% everywhere)

/* tslint:disable:no-var-requires no-require-imports */
let NYC: any = require('nyc');
import * as glob from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Mocha from 'mocha';

/* tslint:disable:no-console */

let packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'UTF-8'));

let runTests = () => {
  let mocha = new Mocha({});

  glob.sync('test/**/*.ts').forEach(file => mocha.addFile(file));

  return new Promise((resolve, reject) => {
    mocha.run((failures: number) => {
      if (failures > 0) {
        reject(`There were ${failures} failures`);
      } else {
        resolve();
      }
    });
  });
};

let handleError = (err: any) => {
  console.error(err);
  process.exit(1);
};

process.env.TS_NODE_FAST = 'true';
require('ts-node').register({ fast: true });

if (packageJson.nyc) {
  let config = packageJson.nyc;
  config.instrumenter = './lib/instrumenters/istanbul';
  let nyc = new NYC(packageJson.nyc);
  nyc.addAllFiles();
  runTests().then(() => {
    nyc.report();
    nyc.checkCoverage({
      lines: config.lines,
      functions: config.functions,
      branches: config.branches,
      statements: config.statements
    });
  }).catch(handleError);
} else {
  runTests().catch(handleError);
}
