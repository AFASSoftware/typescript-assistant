import { Logger } from './logger';
import { TaskRunner } from './taskrunner';

import * as glob from 'glob';

export interface Git {
  findChangedFiles(sinceLastPush?: boolean): Promise<string[]>;
  execute(args: string[]): Promise<string[]>;
}

export let createGit = (config: { taskRunner: TaskRunner, logger: Logger }): Git => {
  let {taskRunner, logger} = config;

  let git: Git = {
    findChangedFiles: (sinceLastPush): Promise<string[]> => {
      let fallback = () => {
        // If not inside a git repository or no changed files found:
        return new Promise((resolve, reject) => {
          glob('**/*.ts', { ignore: ['node_modules/**', 'typings/**'] }, (error, matches) => {
            if (error) {
              reject(error);
            } else {
              resolve(matches);
            }
          });
        });
      };
      let args = sinceLastPush ? ['diff', '--name-only', '--diff-filter=ACMR', 'origin/HEAD', 'HEAD'] : ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'];
      return git.execute(args).then(
        (files) => {
          return files;
        },
        fallback
      );
    },

    execute: (args: string[]) => {
      let lines: string[] = [];
      return taskRunner.runTask('git', args, {
        name: 'git',
        logger,
        handleOutput: (line: string) => {
          lines.push(line);
          return true;
        }
      }).result.then(() => {
        return lines;
      });
    }
  };
  return git;
};
