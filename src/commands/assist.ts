import { Dependencies } from '../dependencies';

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, server, watcher } = deps;

  return {
    execute: () => {
      watcher.watchSourceFileChanged();
      server.start();
      formatter.startVerifying(['source-files-changed']);
      linter.start('format-verified');
      nyc.start(['source-files-changed']);
      compiler.start();
    }
  };
};
