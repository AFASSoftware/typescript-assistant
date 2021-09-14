import * as glob from "glob";

import { Logger } from "./logger";
import { TaskRunner } from "./taskrunner";

export interface Git {
  /**
   * If not in a git repo or no changes, findAllTypescriptFiles() is returned
   */
  findChangedFilesOrAllTypescriptFiles(
    sinceLastPush?: boolean
  ): Promise<string[]>;
  findChangedFiles(sinceLastPush?: boolean): Promise<string[]>;
  findAllTypescriptFiles(): Promise<string[]>;
  isPristine(): Promise<boolean>;
  execute(args: string[]): Promise<string[]>;
  isOnBranch(): Promise<boolean>;
  getBranchName(): Promise<string>;
}

export function createGit(dependencies: {
  taskRunner: TaskRunner;
  logger: Logger;
}): Git {
  const { taskRunner, logger } = dependencies;

  function findAllTypescriptFiles(): Promise<string[]> {
    // Not using this mechanism anymore but a blacklist to allow multiple tsconfig files.
    // let tsConfig = JSON.parse(readFileSync(join(process.cwd(), 'tsconfig.json'), 'UTF-8'));
    // let globs: string[] = tsConfig && tsConfig.include ? tsConfig.include : ['src/**/*.ts', 'test/**/*.ts'];
    let blacklist = [
      "**/node_modules/**",
      "typings/**",
      "build/**",
      "dist/**",
      "**/*.d.ts",
    ];

    return new Promise((resolve, reject) => {
      glob("**/*.ts", { ignore: blacklist }, (error, matches) => {
        if (error) {
          reject(error);
        } else {
          resolve(matches);
        }
      });
    });
  }

  let git: Git = {
    findChangedFiles(sinceLastPush) {
      let args = sinceLastPush
        ? ["diff", "--name-only", "--diff-filter=ACMR", "origin/HEAD", "HEAD"]
        : ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"];
      return git.execute(args).then((files) => {
        return files;
      });
    },
    isPristine() {
      return git.execute(["status", "--porcelain"]).then((modifiedFiles) => {
        return modifiedFiles.length === 0;
      });
    },
    async findChangedFilesOrAllTypescriptFiles(
      sinceLastPush
    ): Promise<string[]> {
      return git
        .findChangedFiles(sinceLastPush)
        .then((files) =>
          files.length === 0 ? findAllTypescriptFiles() : files
        ) // no changed files found => All TS Files
        .catch(findAllTypescriptFiles); // If not inside a git repository
    },
    findAllTypescriptFiles,
    async isOnBranch() {
      let currentBranchName = await git.getBranchName();
      return currentBranchName !== "master";
    },
    async getBranchName() {
      let [stdout] = await git.execute(["rev-parse", "--abbrev-ref", "HEAD"]);
      let currentBranchName = stdout.toString().trim();

      // When in detached HEAD, assume it's master.
      return currentBranchName === "HEAD" ? "master" : currentBranchName;
    },
    execute(args: string[]) {
      let lines: string[] = [];
      return taskRunner
        .runTask("git", args, {
          name: "git",
          logger,
          handleOutput: (line: string) => {
            lines.push(line);
            return true;
          },
        })
        .result.then(() => {
          return lines;
        });
    },
  };
  return git;
}
