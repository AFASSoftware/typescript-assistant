import { ESLint } from "eslint";

import { LinterCommand, LinterResponse } from "./linter";

process.on("message", (msg: LinterCommand) => {
  let eslint = new ESLint({ fix: msg.fix });
  eslint
    .lintFiles(msg.filesToLint)
    .then(async (results) => {
      let fixCount = 0;
      if (msg.fix) {
        fixCount = results.filter((r) => r.output !== undefined).length;
        await ESLint.outputFixes(results);
      }
      let formatter = await eslint.loadFormatter("stylish");
      let resultText = formatter.format(results);

      process.send?.(<LinterResponse>{
        summary: {
          message: resultText,
          errorCount: results.reduce((count, err) => count + err.errorCount, 0),
          warningCount: results.reduce(
            (count, err) => count + err.warningCount,
            0
          ),
          fixableCount: results.reduce(
            (count, err) =>
              count + err.fixableErrorCount + err.fixableWarningCount,
            0
          ),
          fixCount,
        },
      });
      return true;
    })
    .catch((err) => {
      process.send?.(<LinterResponse>{
        error: { message: err.message },
      });
      return false;
    })
    .then((success) => {
      process.send?.(<LinterResponse>{ finished: { success } });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
});
