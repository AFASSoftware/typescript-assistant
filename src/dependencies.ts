import { Bus } from './bus';
import { Formatter } from './code-style/formatter';
import { Linter } from './code-style/linter';
import { Compiler } from './compiler';
import { Git } from './git';
import { Logger } from './logger';
import { TaskRunner } from './taskrunner';
import { NYC } from './testing/nyc';
import { Watcher } from './watcher';

export interface Dependencies {
  watcher: Watcher;
  taskRunner: TaskRunner;
  linter: Linter;
  formatter: Formatter;
  bus: Bus;
  compiler: Compiler;
  git: Git;
  logger: Logger;
  nyc: NYC;
  inject<T>(createFunction: (dependencies: Partial<Dependencies>) => T): T;
}
