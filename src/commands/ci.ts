import { Dependencies } from "../dependencies";
import { Command } from "./command";

export interface CIOptions {
  tests?: boolean;
  format?: boolean;
  coverage?: boolean;
  compileLimit: number;

  disabledProjects?: string[];
}

export function createCICommand(deps: Dependencies): Command<CIOptions> {
  const { formatter, linter, compiler, nyc, git, logger } = deps;

  return {
    async execute(options: CIOptions = { compileLimit: 2 }): Promise<boolean> {
      let {
        tests = true,
        format = true,
        coverage = true,
        disabledProjects,
        compileLimit
      } = options;

      let timestamp = new Date().getTime();
      let allTypescriptFiles = await git.findAllTypescriptFiles();
      let results = await Promise.all([
        compiler.runOnce([], disabledProjects, { compileLimit }),
        format
          ? formatter.verifyFiles(allTypescriptFiles)
          : Promise.resolve(true),
        linter.lintOnce(false, allTypescriptFiles),
        tests ? nyc.run(coverage) : Promise.resolve(true),
      ]);
      let toolErrors = results.filter((result) => result === false).length;
      logger.log(
        "ci",
        `CI tasks took ${Math.round(
          (new Date().getTime() - timestamp) / 1000
        )} seconds`
      );
      if (toolErrors !== 0) {
        logger.error(
          "ci",
          `${toolErrors} tool${toolErrors === 1 ? "" : "s"} reported errors`
        );
        return false;
      }
      return true;
    },
  };
}
