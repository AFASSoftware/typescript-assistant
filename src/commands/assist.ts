import { Dependencies } from '../dependencies';

export interface AssistOptions {
  statusServerPort?: number;
}

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, server, watcher } = deps;

  return {
    execute: (options: AssistOptions) => {
      watcher.watchSourceFileChanged();
      if (options.statusServerPort) {
        server.start(options.statusServerPort);
      }
      formatter.startVerifying(['source-files-changed']);
      linter.start('format-verified');
      nyc.start(['source-files-changed']);
      compiler.start();
    }
  };
};
