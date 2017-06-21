import { Formatter } from '../code-style/formatter';
import { Linter } from '../code-style/linter';

export interface FixCommandDependencies {
  formatter: Formatter;
  linter: Linter;
}

export let createFixCommand = (deps: FixCommandDependencies) => {
  return {
    execute: () => deps.formatter.format().then(
      (success: boolean) => success && deps.linter.lintOnce(true)
    )
  };
};
