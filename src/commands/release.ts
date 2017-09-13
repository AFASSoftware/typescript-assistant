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

      let onBranch = await git.isOnBranch();
      if (onBranch) {
        let answers = await prompt({
          type: 'confirm',
          name: 'confirm',
          message: 'You are not on master, do you want to do a pre-release?'
        });
        if (!answers[0]) {
          return;
        }
        await taskRunner.runTask(npm, ['version', 'prerelease'], { name: 'npm', logger }).result;
      } else {
        let answers = await prompt({
          type: 'list',
          name: 'bump',
          message: 'What type of bump would you like to do?',
          choices: ['patch', 'minor', 'major']
        });
        let importance = answers['bump'] as string;

        // 'npm version' also does a 'git commit' and 'git tag'
        await taskRunner.runTask(npm, ['version', importance], { name: 'npm', logger }).result;
      }

      await git.execute(['push', '--no-verify']);
      await git.execute(['push', '--tags', '--no-verify']);

      let publishArguments = onBranch ? ['publish', '--tag', 'dev'] : ['publish'];
      await taskRunner.runTask(npm, publishArguments, { name: 'npm', logger }).result;
    }
  };
};
