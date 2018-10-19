import { Dependencies } from '../dependencies';

export interface CIOptions {
  tests?: boolean;
}

export let createCICommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, git, logger } = deps;

  return {
    execute: async (options: CIOptions): Promise<boolean> => {
      let { tests = true } = options;

      let timestamp = new Date().getTime();
      let allTypescriptFiles = await git.findAllTypescriptFiles();
      let results = await Promise.all([
        compiler.runOnce([]),
        formatter.verifyFiles(allTypescriptFiles),
        linter.lintOnce(false, allTypescriptFiles),
        tests ? nyc.run() : Promise.resolve(true)
      ]);
      let toolErrors = results.filter(result => result === false).length;
      logger.log('ci', `CI tasks took ${Math.round((new Date().getTime() - timestamp) / 1000)} seconds`);
      if (toolErrors !== 0) {
        logger.error('ci', `${toolErrors} tool${toolErrors === 1 ? '' : 's'} reported errors`);
        return false;
      }
      return true;
    }
  };
};
