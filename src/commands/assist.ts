import { Dependencies } from '../dependencies';

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, mocha, linter, compiler, nyc } = deps;

  return {
    execute: () => {
      formatter.startVerifying('compile-started');
      mocha.start('compile-compiled');
      linter.start('format-verified');
      nyc.start();
      compiler.start();
    }
  };
};
