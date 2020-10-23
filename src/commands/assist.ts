import { Dependencies } from '../dependencies';

export interface AssistOptions {
  statusServerPort?: number;
  format?: boolean;
}

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, server, watcher, logger } = deps;

  return {
    execute: (options: AssistOptions = {}) => {
      const { format = true } = options;

      watcher.watchSourceFileChanged();
      if (options.statusServerPort) {
        server.start(options.statusServerPort);
      }
      if (format) {
        formatter.startVerifying(['source-files-changed']);
      } else {
        logger.log('formatter', 'disabled');
      }
      linter.start('format-verified');
      nyc.start(['source-files-changed']);
      compiler.start();
    }
  };
};
