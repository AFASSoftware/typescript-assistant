import { Dependencies } from '../dependencies';

export interface CIOptions {
  tscArgs?: string[];
}

export let createCICommand = (deps: Dependencies) => {
  let { formatter, linter, compiler, nyc, git } = deps;

  return {
    execute: async (options: CIOptions = {}): Promise<boolean> => {
      let allTypescriptFiles = await git.findAllTypescriptFiles();
      let results = await Promise.all([
        compiler.runOnce(options.tscArgs || []),
        formatter.verifyAll(allTypescriptFiles),
        linter.lintOnce(false, allTypescriptFiles),
        nyc.run()
      ]);
      return !results.some(r => r === false);
    }
  };
};
