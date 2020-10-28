import { Dependencies } from '../dependencies';

export interface AssistOptions {
  statusServerPort?: number;
  format?: boolean;
}

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, server, watcher } = deps;

  return {
    execute: (options: AssistOptions = {}) => {
      const { format = true } = options;

      watcher.watchSourceFileChanged();
      if (options.statusServerPort) {
        server.start(options.statusServerPort);
      }
      if (format) {
        formatter.startVerifying(['source-files-changed']);
        linter.start('format-verified');
      } else {
        linter.start('source-files-changed', true);
      }
      nyc.start(['source-files-changed']);
      compiler.start();
    }
  };
};
