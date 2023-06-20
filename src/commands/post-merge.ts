// post-checkout and post-merge are used to run 'npm install' if needed

import { updateDependencies } from "../helpers";
import { Logger } from "../logger";
import { Command } from "./command";

/* tslint:disable:no-console */

export function createPostMergeCommand(deps: {
  logger: Logger;
}): Command<void> {
  const { logger } = deps;

  return {
    async execute() {
      logger.log("hooks", "postmerge git hook running");

      try {
        await updateDependencies(logger, "ORIG_HEAD");
      } catch (error) {
        logger.error(
          "hooks",
          `post-merge hook failed, continuing anyway ${
            (error as Error).message
          }`
        );
      }

      return Promise.resolve(true);
    },
  };
}
