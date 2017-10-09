import { Dependencies } from '../dependencies';

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, server } = deps;

  return {
    execute: () => {
      // watcher.watchSourceFileChanged();
      formatter.startVerifying(['compile-started' /*, 'source-files-changed' */]);
      linter.start('format-verified');
      nyc.start(['compile-started' /*, 'source-files-changed' */]);
      compiler.start();
      server.start();
    }
  };
};
