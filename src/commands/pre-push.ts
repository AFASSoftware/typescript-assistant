import { Dependencies } from "../dependencies";
import { AssistOptions } from "./assist";
import { Command } from "./command";

export interface PrePushCommandOptions
  extends Pick<AssistOptions, "testConfig" | "testsGlob"> {
  disabledProjects?: string[];
}

export function createPrePushCommand(
  deps: Dependencies
): Command<PrePushCommandOptions> {
  const { compiler, nyc, git, logger } = deps;

  return {
    async execute(options: PrePushCommandOptions = {}): Promise<boolean> {
      const { disabledProjects, testConfig, testsGlob } = options;

      let timestamp = new Date().getTime();
      let pristine = await git.isPristine();
      if (!pristine) {
        logger.error(
          "pre-push",
          "The working directory contains changes that are not committed."
        );
        logger.error(
          "pre-push",
          "The pre-push checks can therefore not be run"
        );
        logger.error("pre-push", "Please stash you work before pushing");
        return false;
      }
      let results = await Promise.all([
        compiler.runOnce([], disabledProjects, { compileLimit: 1 }),
        nyc.run(true, testConfig, testsGlob),
      ]);
      let toolErrors = results.filter((result) => result === false).length;
      logger.log(
        "pre-push",
        `Pre-push tasks took ${Math.round(
          (new Date().getTime() - timestamp) / 1000
        )} seconds`
      );
      return toolErrors === 0;
    },
  };
}
