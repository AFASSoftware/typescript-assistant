import { Dependencies } from "../dependencies";
import { Command } from "./command";

export interface AssistOptions {
  statusServerPort?: number;
  format?: boolean;
  coverage?: boolean;
  projects?: string[];
  testConfig?: string;
  testsGlob?: string;
}

export function createAssistCommand(
  deps: Dependencies
): Command<AssistOptions> {
  const { formatter, linter, compiler, nyc, server, watcher } = deps;

  return {
    execute(options: AssistOptions = {}) {
      const {
        format = true,
        coverage = true,
        projects,
        testConfig,
        testsGlob,
      } = options;

      watcher.watchSourceFileChanged();
      if (options.statusServerPort) {
        server.start(options.statusServerPort);
      }
      if (format) {
        formatter.startVerifying(["source-files-changed"]);
        linter.start("format-verified");
      } else {
        linter.start("source-files-changed", true);
      }
      nyc.start(["source-files-changed"], coverage, testConfig, testsGlob);
      compiler.start(projects);

      return Promise.resolve(true);
    },
  };
}
