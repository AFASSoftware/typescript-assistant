import { prompt } from 'inquirer';
import { sep } from 'path';
import { Dependencies } from '../dependencies';

export let createReleaseCommand = (deps: Dependencies) => {
  let { git, taskRunner, logger } = deps;

  return {
    execute: () => {
      return git.execute(['status', '--porcelain']).then(modifiedFiles => {
        if (modifiedFiles.length > 0) {
          throw new Error('There are uncommitted changes in the working tree');
        }
        let npm = sep === '\\' ? 'npm.cmd' : 'npm';
        return prompt({
          type: 'list',
          name: 'bump',
          message: 'What type of bump would you like to do?',
          choices: ['patch', 'minor', 'major']
        }).then(answers => {
          let importance = answers['bump'] as string;
          return taskRunner.runTask(npm, ['version', importance], { name: 'npm', logger }).result.then(() => {
            // 'npm version' also does a 'git commit' and 'git tag'
            return git.execute(['push', '--no-verify']).then(() => {
              return git.execute(['push', '--tags', '--no-verify']).then(() => {
                return taskRunner.runTask(npm, ['publish'], { name: 'npm', logger }).result;
              });
            });
          });
        });
      });
    }
  };
};
