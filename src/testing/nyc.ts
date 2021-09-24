import { Bus, EventType } from "../bus";
import { Git } from "../git";
import { Logger } from "../logger";
import { Task, TaskRunner } from "../taskrunner";

export interface NYC {
  start(
    triggers: EventType[],
    withCoverage: boolean,
    config?: string,
    testsGlob?: string
  ): void;
  stop(): void;
  run(
    withCoverage?: boolean,
    config?: string,
    testsGlob?: string
  ): Promise<boolean>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createNyc(dependencies: {
  taskRunner: TaskRunner;
  logger: Logger;
  bus: Bus;
  git: Git;
}): NYC {
  const { taskRunner, logger, bus, git } = dependencies;
  let runningTask: Task | undefined;
  let coolingDown: Promise<void> | undefined;

  async function startNyc(
    withCoverage = true,
    config?: string,
    testsGlob = "test/**/*-tests.ts*"
  ): Promise<boolean> {
    let hasFailingTest = false;
    let myCoolingDown = delay(100);
    coolingDown = myCoolingDown;
    await myCoolingDown;
    if (coolingDown !== myCoolingDown) {
      return false;
    }

    if (runningTask) {
      logger.log("nyc", "Aborting previous nyc run");
      runningTask.kill();
      runningTask = undefined;
    } else {
      bus.report({ tool: "test", status: "busy" });
      bus.report({ tool: "coverage", status: "busy" });
    }
    let lastLineWasNotOk = false;

    function handleOutput(line: string) {
      if (task === runningTask) {
        let notOk = /^not ok \d+ (.*)/.exec(line);
        let ok = /^ok \d+ (.*)/.exec(line);
        if (notOk) {
          lastLineWasNotOk = true;
          logger.log("nyc", `FAILED: ${notOk[1]}`);
          hasFailingTest = true;
        } else if (ok) {
          lastLineWasNotOk = false;
        } else if (lastLineWasNotOk) {
          logger.log("nyc", line);
        }
      }
      return true;
    }

    function handleError(line: string) {
      if (task === runningTask && !line.startsWith("ERROR: Coverage for")) {
        logger.error("nyc", line);
      }
      return true;
    }

    if (withCoverage) {
      runningTask = taskRunner.runTask(
        "./node_modules/.bin/nyc",
        [
          config ? `--nycrc-path ${config}` : "",
          "--check-coverage",
          "-- mocha --require ts-node/register/transpile-only --exit --reporter tap",
          `"${testsGlob}"`,
        ]
          .join(" ")
          .trim()
          .split(" "),
        {
          name: "nyc",
          logger,
          handleOutput,
          handleError,
        }
      );
    } else {
      logger.log("nyc", "running tests without coverage");
      runningTask = taskRunner.runTask(
        "./node_modules/.bin/mocha",
        [
          "--require ts-node/register/transpile-only --exit --reporter tap",
          `"${testsGlob}"`,
        ]
          .join(" ")
          .split(" "),
        {
          name: "nyc",
          logger,
          handleOutput,
          handleError,
        }
      );
    }
    let task = runningTask;
    return runningTask.result
      .then(() => {
        if (task === runningTask) {
          runningTask = undefined;
          logger.log("nyc", withCoverage ? "code coverage OK" : "tests ok");
          bus.report({ tool: "test", status: "ready", errors: 0 });
          bus.report({ tool: "coverage", status: "ready", errors: 0 });
        }
        return true;
      })
      .catch(async () => {
        if (task === runningTask) {
          runningTask = undefined;
          logger.log("nyc", "code coverage FAILED");
          bus.report({
            tool: "test",
            status: "ready",
            errors: hasFailingTest ? 1 : 0,
          });
          bus.report({ tool: "coverage", status: "ready", errors: 1 });
        }
        let isOnBranch = await git.isOnBranch();
        return isOnBranch && !hasFailingTest;
      });
  }

  let callback: (() => Promise<boolean>) | undefined;

  return {
    run(withCoverage?: boolean, config?: string, testsGlob?: string) {
      return startNyc(withCoverage, config, testsGlob).catch(() => false);
    },
    start(
      triggers: EventType[],
      withCoverage,
      config?: string,
      testsGlob?: string
    ) {
      callback = () => startNyc(withCoverage, config, testsGlob);
      bus.registerAll(triggers, callback as () => void);
      callback().catch(() => false);
    },
    stop() {
      bus.unregister(callback as () => void);
    },
  };
}
