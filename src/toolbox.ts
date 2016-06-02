import {TaskRunner} from './taskrunner';
import {Configuration} from './configuration';
import {Linter} from './code-style/linter';
import {Formatter} from './code-style/formatter';
import {Git} from './git';
import {Compiler} from './compiler';
import {Bus} from './bus';
import {Logger} from './logger';
import {Mocha} from './testing/mocha';

export interface Toolbox {
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
