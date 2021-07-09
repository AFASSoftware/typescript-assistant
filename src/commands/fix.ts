import { Formatter } from "../code-style/formatter";
import { Linter } from "../code-style/linter";
import { Git } from "../git";
import { isTypescriptFile } from "../util";
import { Command } from "./command";

export interface FixCommandDependencies {
  formatter: Formatter;
  linter: Linter;
  git: Git;
}

export function createFixCommand(deps: FixCommandDependencies): Command<void> {
  const { formatter, linter, git } = deps;

  return {
    async execute() {
      let changedFiles = (await git.findChangedFiles()).filter(
        isTypescriptFile
      );
      let success = await formatter.formatFiles(changedFiles);
      if (success) {
        success = await linter.lintOnce(true, changedFiles);
      }
      return success;
    },
  };
}
