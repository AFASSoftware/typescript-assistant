import { npmInstall, packageJsonChanged } from "../helpers";
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
    execute(options: PostCheckoutOptions) {
      try {
        logger.log("hooks", "postcheckout git hook running");

        let { previousHead } = options;
        if (previousHead === "%1") {
          previousHead = "ORIG_HEAD";
        }

        if (packageJsonChanged(previousHead, "HEAD")) {
          logger.log("hooks", "Running npm install...");
          npmInstall();
        } else {
          logger.log("hooks", "No need to run npm install");
        }
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
