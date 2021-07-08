import { Dependencies } from '../dependencies';
import { Command } from './command';

export function createLintCommand(deps: Dependencies): Command<void> {
  const { linter, git, logger } = deps;

  return {
    async execute(): Promise<boolean> {
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
}
