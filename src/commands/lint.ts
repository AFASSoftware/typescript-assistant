import { Dependencies } from '../dependencies';

export let createLintCommand = (deps: Dependencies) => {
  let { linter, git, logger } = deps;

  return {
    execute: async (): Promise<boolean> => {
      let timestamp = new Date().getTime();
      let allTypescriptFiles = await git.findAllTypescriptFiles();
      let results = await Promise.all([
        linter.lintOnce(false, allTypescriptFiles)
      ]);
      let toolErrors = results.filter(result => result === false).length;
      logger.log('lint', `Lint task took ${Math.round((new Date().getTime() - timestamp) / 1000)} seconds`);
      if (toolErrors !== 0) {
        logger.error('lint', `${toolErrors} tool${toolErrors === 1 ? '' : 's'} reported errors`);
        return false;
      }
      return true;
    }
  };
};
