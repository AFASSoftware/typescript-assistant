import { Dependencies } from '../dependencies';

export let assist = (toolbox: Dependencies) => {
  toolbox.formatter.startVerifying('compile-started');
  toolbox.mocha.start('compile-compiled');
  toolbox.linter.start('createFormatCommand-verified');
  toolbox.compiler.start();
};
