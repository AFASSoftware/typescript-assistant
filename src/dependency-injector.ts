import { Dependencies } from './dependencies';
import { createWatcher } from './watcher';
import { createNyc } from './testing/nyc';
import { createLinter } from './code-style/linter';
import { createFormatter } from './code-style/formatter';
import { createGit } from './git';
import { createCompiler } from './compiler';
import { createInjector } from './injector';
import { createBus } from './bus';
import { createDefaultTaskRunner, createWindowsTaskRunner } from './taskrunner';
import { sep } from 'path';
import { createConsoleLogger } from './logger';
import { Server } from './server';

export let createDependencyInjector = (): <T>(createFunction: (dependencies: Partial<Dependencies>) => T) => T => {
  let logger = createConsoleLogger();
  let taskRunner = sep === '\\' ? createWindowsTaskRunner() : createDefaultTaskRunner();
  let bus = createBus();

  let dependencies: Partial<Dependencies> = {
    bus, logger, taskRunner
  };

  let { inject } = createInjector(dependencies);

  dependencies.inject = inject;
  dependencies.compiler = inject(createCompiler);
  dependencies.git = inject(createGit);
  dependencies.formatter = inject(createFormatter);
  dependencies.linter = inject(createLinter);
  dependencies.nyc = inject(createNyc);
  dependencies.watcher = inject(createWatcher);

  // Server is created lazily, because not all of its dependencies may be present
  let server: Server | undefined;
  Object.defineProperty(dependencies, 'server', {
    get: () => {
      if (!server) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        server = inject(require('./server').createServer);
      }
      return server;
    }
  });

  return dependencies.inject;
};
