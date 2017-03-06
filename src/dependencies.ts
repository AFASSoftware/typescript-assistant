import { Bus } from './bus';
import { Formatter } from './code-style/formatter';
import { Linter } from './code-style/linter';
import { Compiler } from './compiler';
import { Configuration } from './configuration';
import { Git } from './git';
import { Logger } from './logger';
import { TaskRunner } from './taskrunner';
import { Mocha } from './testing/mocha';

export interface Dependencies {
  taskRunner: TaskRunner;
  configuration: Configuration;
  linter: Linter;
  formatter: Formatter;
  bus: Bus;
  compiler: Compiler;
  git: Git;
  logger: Logger;
  mocha: Mocha;
}
