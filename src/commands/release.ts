import {Toolbox} from '../toolbox';
import {prompt} from 'inquirer';
import {sep} from 'path';

export let release = (toolbox: Toolbox) => {
  let {git, taskRunner, logger} = toolbox;

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
      return taskRunner.runTask(npm, ['version', importance], {name: 'npm', logger}).result.then(() => {
        // 'npm version' also does a 'git commit' and 'git tag'
        return git.execute(['push']).then(() => {
          return git.execute(['push', '--tags']).then(() => {
            return taskRunner.runTask(npm, ['publish'], {name: 'npm', logger}).result;
          });
        });
      });
    });
  });
};
