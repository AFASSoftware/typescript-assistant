import { prompt } from 'inquirer';
import { sep } from 'path';
import { Dependencies } from '../dependencies';

export let createReleaseCommand = (deps: Dependencies) => {
  let { git, taskRunner, logger } = deps;

  return {
    execute: async () => {
      let pristine = await git.isPristine();
      if (!pristine) {
        throw new Error('There are uncommitted changes in the working tree');
      }

      let npm = sep === '\\' ? 'npm.cmd' : 'npm';
      let answers = await prompt({
        type: 'list',
        name: 'bump',
        message: 'What type of bump would you like to do?',
        choices: ['patch', 'minor', 'major']
      });
      let importance = answers['bump'] as string;

      // 'npm version' also does a 'git commit' and 'git tag'
      await taskRunner.runTask(npm, ['version', importance], { name: 'npm', logger }).result;

      await git.execute(['push', '--no-verify']);

      await git.execute(['push', '--tags', '--no-verify']);

      await taskRunner.runTask(npm, ['publish'], { name: 'npm', logger }).result;
    }
  };
};
