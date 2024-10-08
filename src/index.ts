#!/usr/bin/env node

import { gte } from "semver";
import * as yargsModule from "yargs";

import { createAssistCommand } from "./commands/assist";
import { createCICommand } from "./commands/ci";
import { createCleanCommand } from "./commands/clean";
import { createFixCommand } from "./commands/fix";
import { createFixAllCommand } from "./commands/fix-all";
import { createInitCommand } from "./commands/init";
import { createLintCommand } from "./commands/lint";
import { createPostCheckoutCommand } from "./commands/post-checkout";
import { createPostMergeCommand } from "./commands/post-merge";
import { createPreCommitCommand } from "./commands/pre-commit";
import { createPrePushCommand } from "./commands/pre-push";
import { createDependencyInjector } from "./dependency-injector";

/* eslint-disable no-console */

if (gte("v12.0.0", process.version)) {
  console.error("Please update your version of Node.");
  process.exit(1);
}

let inject = createDependencyInjector();

let onSuccess = () => {
  process.exit(0);
};

let onFailure = (error: any) => {
  console.error(error);
  process.exit(1);
};

let failIfUnsuccessful = (success: boolean) => {
  if (!success) {
    process.exit(1);
  }
};

yargsModule.command(
  ["assist", "*"],
  "Watches for file changes and outputs current errors and violations",
  {
    port: {
      describe: "the port to have the status server listen on",
    },
    format: {
      describe: "check formatting during assist",
      default: true,
      boolean: true,
    },
    coverage: {
      describe: "run tests with coverage",
      boolean: true,
      default: true,
    },
    project: {
      describe: "provide tsconfigs to watch",
      string: true,
      type: "array",
    },
    testConfig: {
      describe: "path to nyc config file",
      string: true,
    },
    testsGlob: {
      describe: "glob for test files",
      string: true,
    },
  },
  (yargs) => {
    if (
      yargs._.length === 0 ||
      (yargs._.length === 1 && yargs._[0] === "assist")
    ) {
      void inject(createAssistCommand).execute({
        statusServerPort: parseInt(yargs.port as string, 10) || 0,
        format: yargs.format,
        coverage: yargs.coverage,
        projects: yargs.project,
        testConfig: yargs.testConfig,
        testsGlob: yargs.testsGlob,
      });
    } else {
      console.error("Unknown command");
      process.exit(1);
    }
  }
);

yargsModule.command(["lint"], "Lints", {}, (yargs) => {
  inject(createLintCommand).execute().then(onSuccess, onFailure);
});

yargsModule.command(
  ["fix", "f"],
  "Formats changed files and applies tslint fixes",
  {},
  (yargs) => {
    inject(createFixCommand).execute().then(onSuccess, onFailure);
  }
);

yargsModule.command(
  ["fixall"],
  "Formats all files and applies tslint fixes",
  {},
  (yargs) => {
    inject(createFixAllCommand).execute().then(onSuccess, onFailure);
  }
);

yargsModule.command(
  ["clean", "c"],
  "Deletes all output files and intermediate files",
  {},
  (yargs) => {
    void inject(createCleanCommand).execute();
  }
);

yargsModule.command(
  ["ci"],
  "Runs all tools in parallel to find errors",
  {
    tests: {
      describe: "Run the test and coverage command",
      boolean: true,
      default: true,
    },
    format: {
      describe: "check formatting during command",
      boolean: true,
      default: true,
    },
    coverage: {
      describe: "run tests with coverage",
      boolean: true,
      default: true,
    },
    disable: {
      string: true,
      type: "array",
    },
    compileLimit: {
      describe: "Limit the number of concurrent compilations",
      number: true,
      default: 2,
    },
  },
  (yargs) => {
    inject(createCICommand)
      .execute({
        tests: yargs.tests,
        format: yargs.format,
        coverage: yargs.coverage,
        disabledProjects: yargs.disable,
        compileLimit: yargs.compileLimit,
      })
      .then(failIfUnsuccessful, onFailure);
  }
);

yargsModule.command(
  "init",
  "Initialize or repair all features of typescript-assistant in your project",
  {},
  (yargs) => {
    void inject(createInitCommand).execute(true);
  }
);

yargsModule.command(
  "pre-commit",
  "Pre-commit git hook for husky",
  (yargs) => {
    return yargs.boolean("format").default("format", true);
  },
  (yargs) => {
    inject(createPreCommitCommand)
      .execute({
        format: yargs.format,
      })
      .then(onSuccess, onFailure);
  }
);

yargsModule.command(
  "post-checkout",
  "Post-checkout git hook for husky",
  {
    previous: {
      describe: "The previous checkout head",
      string: true,
      demandOption: true,
    },
    new: {
      describe: "The new checkout head",
      string: true,
      demandOption: true,
    },
    branch: {
      coerce(arg) {
        return arg === 1;
      },
    },
  },
  (yargs) => {
    void inject(createPostCheckoutCommand).execute({
      previousHead: yargs.previous,
      newHead: yargs.new,
      isBranch: yargs.branch,
    });
  }
);

yargsModule.command(
  "post-merge",
  "Post-merge git hook for husky",
  {},
  (yargs) => {
    void inject(createPostMergeCommand).execute();
  }
);

yargsModule.command(
  "pre-push",
  "Pre-push git hook for husky",
  {
    disable: {
      string: true,
      type: "array",
    },
    testConfig: {
      describe: "path to nyc config file",
      string: true,
    },
    testsGlob: {
      describe: "glob for test files",
      string: true,
    },
  },
  (yargs) => {
    inject(createPrePushCommand)
      .execute({
        disabledProjects: yargs.disable,
        testConfig: yargs.testConfig,
        testsGlob: yargs.testsGlob,
      })
      .then(failIfUnsuccessful, onFailure);
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
yargsModule.strict().argv;
