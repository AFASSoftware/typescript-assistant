import { Formatter } from '../code-style/formatter';
import { Linter } from '../code-style/linter';
import { Git } from '../git';
import { Command } from './command';

export interface FixAllCommandDependencies {
  formatter: Formatter;
  linter: Linter;
  git: Git;
}

export function createFixAllCommand(deps: FixAllCommandDependencies): Command<void> {
  const { formatter, linter, git } = deps;

  return {
    async execute() {
      let allFiles = (await git.findAllTypescriptFiles());
      let success = await formatter.formatFiles(allFiles);
      if (success) {
        success = await linter.lintOnce(true, allFiles);
      }
      return success;
    }
  };
}
