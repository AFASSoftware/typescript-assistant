// pre-commit makes sure the changed code is formatted and linted.
//
// Rationale:
// - Fixing formatting and linting errors are always fast and easy to fix.
// - This prevents over-complicated merge conflicts
// - This prevents small formatting/linting fix commits

/* tslint:disable no-null-keyword */
import { Dependencies } from "../dependencies";
import { isTypescriptFile } from "../util";
import { Command } from "./command";

export interface PreCommitCommandOptions {
  format?: boolean;
}

export function createPreCommitCommand(
  deps: Dependencies
): Command<PreCommitCommandOptions> {
  const { logger, linter, git, formatter } = deps;

  return {
    async execute(options: PreCommitCommandOptions = {}) {
      let { format = true } = options;

      let files = (await git.findChangedFiles()).filter(isTypescriptFile);

      let lintFiles = () => {
        return linter.lintOnce(false, files);
      };

      if (format) {
        if (!(await formatter.verifyFiles(files))) {
          logger.log(
            "hooks",
            "Not all files were formatted, Hint: run `npm run fix`"
          );
          process.exit(1);
        } else {
          logger.log("hooks", "All files were formatted");
        }
      }

      let result = await lintFiles();

      if (result) {
        logger.log("hooks", `All ${files.length} files were linted`);
        process.exit(0);
      } else {
        logger.log("hooks", "There were linting errors");
        process.exit(1);
      }
    },
  };
}
