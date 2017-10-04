import { Dependencies } from '../dependencies';

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc } = deps;

  return {
    execute: () => {
      // watcher.watchSourceFileChanged();
      formatter.startVerifying(['compile-started' /*, 'source-files-changed' */]);
      linter.start('format-verified');
      nyc.start();
      compiler.start();
    }
  };
};
