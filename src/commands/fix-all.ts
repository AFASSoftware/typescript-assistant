import { Formatter } from '../code-style/formatter';
import { Linter } from '../code-style/linter';
import { Git } from '../git';

export interface FixAllCommandDependencies {
  formatter: Formatter;
  linter: Linter;
  git: Git;
}

export let createFixAllCommand = (deps: FixAllCommandDependencies) => {
  let { formatter, linter, git } = deps;
  return {
    execute: async () => {
      let allFiles = (await git.findAllTypescriptFiles());
      let success = await formatter.formatFiles(allFiles);
      if (success) {
        success = await linter.lintOnce(true, allFiles);
      }
      return success;
    }
  };
};
