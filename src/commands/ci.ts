import { Dependencies } from '../dependencies';

export interface CIOptions {
  tscArgs?: string[];
}

export let createCICommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, git, logger } = deps;

  return {
    execute: async (options: CIOptions = {}): Promise<boolean> => {
      let allTypescriptFiles = await git.findAllTypescriptFiles();
      let results = await Promise.all([
        compiler.runOnce(options.tscArgs || []),
        formatter.verifyFiles(allTypescriptFiles),
        linter.lintOnce(false, allTypescriptFiles),
        nyc.run()
      ]);
      let toolErrors = results.filter(result => result === false).length;
      if (toolErrors !== 0) {
        logger.error('ci', `${toolErrors} tool${toolErrors === 1 ? '' : 's'} reported errors`);
        return false;
      }
      return true;
    }
  };
};
