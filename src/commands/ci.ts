import { Dependencies } from '../dependencies';

let detectSocketError = (deps: Dependencies, location: string) => (err: Error) => {
  if (err.hasOwnProperty('message') && err.message === 'socket hang up') {
    deps.logger.log('Socket error at', location);
  }

  return err;
};

export let createCICommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, git, logger } = deps;

  return {
    execute: async (): Promise<boolean> => {
      let timestamp = new Date().getTime();
      let allTypescriptFiles = await git.findAllTypescriptFiles();
      let results = await Promise.all([
        compiler.runOnce([]).catch(detectSocketError(deps, 'Compiler')),
        formatter.verifyFiles(allTypescriptFiles).catch(detectSocketError(deps, 'Formatter')),
        linter.lintOnce(false, allTypescriptFiles).catch(detectSocketError(deps, 'Linter')),
        nyc.run().catch(detectSocketError(deps, 'NYC'))
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
