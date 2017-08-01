import * as chokidar from 'chokidar';
import { Bus } from './bus';

export interface Watcher {
  watchTestFileChanged: () => void;
}

export let createWatcher = (dependencies: { bus: Bus }): Watcher => {
  let { bus } = dependencies;
  return {
    watchTestFileChanged: () => {
      let timeout: any;
      chokidar.watch('./test/**/*.ts').on('all', (evt, path) => {
        // batch events for a short amount of time to catch an IDE doing a save-all
        if (timeout === undefined) {
          timeout = setTimeout(() => {
            timeout = undefined;
            bus.signal('test-files-changed');
          }, 100);
        }
      });
    }
  };
};
