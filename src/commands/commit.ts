import { Dependencies } from '../dependencies';

export let createCommitCommand = (deps: Dependencies) => {
  let {git, logger, formatter, linter, bus, compiler} = deps;

  return {
    execute: async () => {
      await formatter.format();
      formatter.startVerifying('compile-compiled');
      linter.start('format-verified');
      bus.register('lint-linted', () => {
        compiler.stop();
        formatter.stopVerifying();
        linter.stop();
        git.execute(['add', '.']).then(
          () => {
            git.execute(['commit', '--no-verify']).then(() => {
              logger.log('commit', 'committed');
              process.exit(0);
            });
          },
          (error: Object) => logger.error('commit', error.toString())
        );
      });
    }
  };
};
