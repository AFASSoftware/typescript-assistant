import { updateDependencies } from "../helpers";
import { Logger } from "../logger";
import { Command } from "./command";

export interface PostCheckoutOptions {
  previousHead: string;
  newHead: string;
  isBranch?: boolean;
}

export function createPostCheckoutCommand(deps: {
  logger: Logger;
}): Command<PostCheckoutOptions> {
  const { logger } = deps;

  return {
    async execute(options: PostCheckoutOptions) {
      try {
        logger.log("hooks", "postcheckout git hook running");

        let { previousHead } = options;
        if (previousHead === "%1") {
          previousHead = "ORIG_HEAD";
        }

        await updateDependencies(logger, previousHead);
      } catch (error) {
        logger.error(
          "hooks",
          `post-checkout hook failed, continuing anyway ${
            (error as Error).message
          }`
        );
      }

      return Promise.resolve(true);
    },
  };
}
