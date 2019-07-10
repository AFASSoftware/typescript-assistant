import { Dependencies } from '../dependencies';

export interface PrePushCommandOptions {
  disabledProjects?: string[];
}

export let createPrePushCommand = (deps: Dependencies) => {
  let { compiler, nyc, git, logger } = deps;

  return {
    execute: async (options: PrePushCommandOptions = {}): Promise<boolean> => {
      let timestamp = new Date().getTime();
      let pristine = await git.isPristine();
      if (!pristine) {
        logger.error('pre-push', 'The working directory contains changes that are not committed.');
        logger.error('pre-push', 'The pre-push checks can therefore not be run');
        logger.error('pre-push', 'Please stash you work before pushing');
        return false;
      }
      let results = await Promise.all([
        compiler.runOnce([], options.disabledProjects),
        nyc.run()
      ]);
      let toolErrors = results.filter(result => result === false).length;
      logger.log('pre-push', `Pre-push tasks took ${Math.round((new Date().getTime() - timestamp) / 1000)} seconds`);
      return toolErrors === 0;
    }
  };
};
