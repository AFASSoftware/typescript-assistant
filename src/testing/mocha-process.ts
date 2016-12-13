import { MochaCommand, MochaResponse } from './mocha';

import * as Mocha from 'mocha';

require('source-map-support').install();

let sendResponse = (response: MochaResponse) => {
  process.send(response);
};

class CustomReporter {
  constructor(runner: any) {
    runner.on('fail', function(
      test: { title: string, file: string },
      err: { message: string, stack: string }
    ) {
      sendResponse({
        testResult: {
          fileName: test.file,
          title: test.title,
          error: err.message,
          stack: err.stack
        }
      });
    });

    runner.on('pass', function(test: any) {
      sendResponse({
        testResult: {
          fileName: test.file,
          title: test.title
        }
      });
    });
  }
}

let mocha = new Mocha({ reporter: CustomReporter } as any);

process.on('message', (msg: MochaCommand) => {
  msg.testFiles.forEach(testFile => {
    mocha.addFile(testFile);
  });
  mocha.run((failures: number) => {
    sendResponse({ finished: { success: failures === 0 } });
    process.exit(0);
  });
});
