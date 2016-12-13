import { Toolbox } from '../toolbox';

export let assist = (toolbox: Toolbox) => {
  toolbox.formatter.startVerifying('compile-started');
  toolbox.mocha.start('compile-compiled');
  toolbox.linter.start('format-verified');
  toolbox.compiler.start();
};
