import { Dependencies } from '../dependencies';
import { createVerifyCommitCommand } from './verify-commit';

export let createCommitCommand = (deps: Dependencies) => {
  let {git, logger, inject} = deps;

  return {
    execute: async () => {
      let canCommit = await inject(createVerifyCommitCommand).execute();
      if (canCommit) {
        git.execute(['add', '.']).then(
          () => {
            git.execute(['commit', '--no-verify']).then(() => {
              logger.log('commit', 'committed');
              process.exit(0);
            });
          },
          (error: Object) => logger.error('commit', error.toString())
        );
      }
    }
  };
};
