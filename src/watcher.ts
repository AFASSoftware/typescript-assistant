import * as chokidar from 'chokidar';
import { Bus } from './bus';

export interface Watcher {
  watchSourceFileChanged(): void;
}

export let createWatcher = (dependencies: { bus: Bus }): Watcher => {
  let { bus } = dependencies;
  return {
    watchSourceFileChanged: () => {
      let timeout: any;
      chokidar.watch('./**/*.ts', { ignoreInitial: true }).on('all', (evt, path) => {
        // batch events for a short amount of time to catch an IDE doing a save-all
        if (timeout === undefined) {
          timeout = setTimeout(() => {
            timeout = undefined;
            bus.signal('source-files-changed');
          }, 100);
        }
      });
    }
  };
};
