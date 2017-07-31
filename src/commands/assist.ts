import { Dependencies } from '../dependencies';
import * as fs from 'fs';

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, watcher } = deps;

  return {
    execute: () => {
      if (fs.existsSync('./test/tsconfig.json')) {
        // The presence of a tsconfig.json in the test folder indicates that tests are not compiled during `tsc --watch` on the root folder
        watcher.watchTestFileChanged();
      }
      formatter.startVerifying(['compile-started', 'test-files-changed']);
      linter.start('format-verified');
      nyc.start();
      compiler.start();
    }
  };
};
