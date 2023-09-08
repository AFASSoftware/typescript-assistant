import * as fs from "fs";
import { promisify } from "util";

import { check, format, resolveConfig } from "prettier";

import { Bus, EventType } from "../bus";
import { Git } from "../git";
import { Logger } from "../logger";
import { absolutePath, isTypescriptFile } from "../util";

let readFile = promisify(fs.readFile);
let writeFile = promisify(fs.writeFile);

export interface Formatter {
  formatFiles(files: string[] | undefined): Promise<boolean>;
  verifyFiles(files: string[]): Promise<boolean>;
  startVerifying(triggers: EventType[]): void;
  stopVerifying(): void;
}

export function createFormatter(dependencies: {
  logger: Logger;
  git: Git;
  bus: Bus;
}): Formatter {
  const { logger, bus, git } = dependencies;

  let runningFormatter: Promise<void> | undefined;
  let rescheduled = false;

  function logError(err: any) {
    return logger.error("formatter", `error: ${err}`);
  }

  async function runFormatterOn(
    files: string[],
    write: boolean
  ): Promise<boolean> {
    logger.log("formatter", `checking ${files.length} files...`);
    let options = await resolveConfig(process.cwd());
    let checks = await Promise.all(files.map(runFile));
    return !checks.some((c) => !c);

    async function runFile(file: string): Promise<boolean> {
      let text = await readFile(file, "utf8");
      if (write) {
        let newText = await format(text, options ?? undefined);
        if (text !== newText) {
          await writeFile(file, newText);
          logger.log("formatter", `Fixed ${absolutePath(file)}`);
          return false;
        }
        return true;
      } else {
        let result = await check(text, options ?? undefined);
        if (!result) {
          logger.log("formatter", `Not formatted ${absolutePath(file)}`);
        }
        return result;
      }
    }
  }

  async function runFormatter(write: boolean) {
    let files = await git.findChangedFiles();
    files = files.filter(isTypescriptFile);
    return runFormatterOn(files, write);
  }

  function verifyFormat() {
    if (runningFormatter) {
      rescheduled = true;
    } else {
      bus.report({
        tool: "format",
        status: "busy",
      });
      runningFormatter = runFormatter(false)
        .then((success) => {
          logger.log(
            "formatter",
            success ? "all files formatted" : "unformatted files found"
          );
          bus.signal(success ? "format-verified" : "format-errored");
          bus.report({
            tool: "format",
            status: "ready",
            errors: success ? 0 : 1,
            fixable: success ? 0 : 1,
          });
        })
        .catch(logError)
        .then(() => {
          runningFormatter = undefined;
          if (rescheduled) {
            rescheduled = false;
            verifyFormat();
          }
        })
        .catch(logError);
    }
  }

  return {
    verifyFiles(files) {
      return runFormatterOn(files, false);
    },
    async formatFiles(files) {
      if (!files) {
        files = (await git.findChangedFiles()).filter(isTypescriptFile);
      }
      await runFormatterOn(files, true);
      logger.log("formatter", "Done");
      return true;
    },
    startVerifying(triggers: EventType[]) {
      bus.registerAll(triggers, verifyFormat);
      verifyFormat();
    },
    stopVerifying() {
      bus.unregister(verifyFormat);
    },
  };
}
