import { execSync } from "child_process";
import { sep } from "path";

import { Answers, prompt } from "inquirer";

import { Dependencies } from "../dependencies";
import { Command } from "./command";

export interface ReleaseCommandOptions {
  otp?: string;
}

export function createReleaseCommand(
  deps: Dependencies
): Command<ReleaseCommandOptions> {
  const { git, taskRunner, logger } = deps;

  return {
    async execute(options = {}) {
      let pristine = await git.isPristine();
      if (!pristine) {
        throw new Error("There are uncommitted changes in the working tree");
      }
      let npm = sep === "\\" ? "npm.cmd" : "npm";

      let onBranch = await git.isOnBranch();
      if (onBranch) {
        let answers: Answers = await prompt({
          type: "confirm",
          name: "confirm",
          message: "You are not on master, do you want to do a pre-release?",
        });
        if (!answers["confirm"]) {
          return true;
        }
        let tag = await git.getBranchName();
        await taskRunner.runTask(
          npm,
          ["version", "prerelease", "--preid", tag],
          {
            name: "npm",
            logger,
          }
        ).result;
      } else {
        let answers: Answers = await prompt({
          type: "list",
          name: "bump",
          message: "What type of bump would you like to do?",
          choices: ["patch", "minor", "major"],
        });
        let importance = answers["bump"] as string;

        // 'npm version' also does a 'git commit' and 'git tag'
        execSync(
          [npm, "version", importance, "--commit-hooks", "false"].join(" "),
          { stdio: [0, 1, 2], cwd: process.cwd() }
        );
      }

      await git.execute(["push", "--no-verify"]);
      await git.execute(["push", "--tags", "--no-verify"]);

      let publishArguments = onBranch
        ? ["publish", "--tag", "dev"]
        : ["publish"];
      publishArguments.push("--commit-hooks", "false");

      if (options.otp) {
        publishArguments.push("--otp", options.otp);
      }

      // Using execSync to allow user interaction to do 2 factor authentication
      execSync([npm, ...publishArguments].join(" "), { stdio: [0, 1, 2] });

      return true;
    },
  };
}
