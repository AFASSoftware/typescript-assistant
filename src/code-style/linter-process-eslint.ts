import { LinterCommand, LinterResponse } from './linter';
import { ESLint } from 'eslint';

let eslint = new ESLint({});

process.on('message', (msg: LinterCommand) => {
  eslint.lintFiles(msg.filesToLint).then(async (results) => {
    let formatter = await eslint.loadFormatter('stylish');
    let resultText = formatter.format(results);

    if (resultText) {
      process.send?.(<LinterResponse>{
        violationSummary: {
          message: resultText,
          errorCount: results.reduce((count, err) => count + err.errorCount, 0),
          warningCount: results.reduce((count, err) => count + err.warningCount, 0),
          fixableCount: results.reduce((count, err) => count + err.fixableErrorCount + err.fixableWarningCount, 0)
        }
      });
      return false;
    }
    return true;
  }).catch(err => {
    process.send?.(<LinterResponse>{
      error: { message: err.message }
    });
    return false;
  }).then(success => {
    process.send?.(<LinterResponse>{ finished: { success } });
  }).catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
  });
});
