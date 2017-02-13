// pre-commit makes sure the changed code is formatted and linted.
//
// Rationale:
// - Fixing formatting and linting errors are always fast and easy to fix.
// - This prevents over-complicated merge conflicts
// - This prevents small formatting/linting fix commits

/* tslint:disable:no-var-requires no-require-imports */
let NYC: any = require('nyc');
import * as glob from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Mocha from 'mocha';

/* tslint:disable:no-console */

let packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'UTF-8'));

let runTests = () => {
  let mocha = new Mocha({} as any);

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

if (packageJson.nyc) {
  let config = packageJson.nyc;
  process.env.TS_NODE_FAST = 'true';
  let nyc = new NYC(packageJson.nyc);
  nyc.addAllFiles();
  runTests().then(() => {
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
