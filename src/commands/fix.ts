import { Formatter } from '../code-style/formatter';
import { Linter } from '../code-style/linter';
import { Git } from '../git';
import { isTypescriptFile } from '../util';

export interface FixCommandDependencies {
  formatter: Formatter;
  linter: Linter;
  git: Git;
}

export let createFixCommand = (deps: FixCommandDependencies) => {
  let { formatter, linter, git } = deps;
  return {
    execute: async () => {
      let changedFiles = (await git.findChangedFiles()).filter(isTypescriptFile);
      let success = await formatter.formatFiles(changedFiles);
      if (success) {
        success = await linter.lintOnce(true, changedFiles);
      }
      return success;
    }
  };
};
