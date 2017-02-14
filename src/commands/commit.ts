import { Toolbox } from '../toolbox';

export let commit = (tools: Toolbox) => {
  let {formatter, linter, bus, compiler, git, logger} = tools;
  formatter.format().then(() => {
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
    compiler.start();
  });
};
