import { Dependencies } from '../dependencies';

export let createAssistCommand = (deps: Dependencies) => {
  let { formatter, mocha, linter, compiler } = deps;

  return {
    execute: () => {
      formatter.startVerifying('compile-started');
      mocha.start('compile-compiled');
      linter.start('format-verified');
      compiler.start();
    }
  };
};
