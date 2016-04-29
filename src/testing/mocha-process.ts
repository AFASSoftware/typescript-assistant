import {MochaCommand, MochaResponse} from './mocha';

import * as Mocha from 'mocha';

let sendResponse = (response: MochaResponse) => {
  process.send(response);
};

let reporter = (runner: any) => {
  runner.on('fail', function(test: { title: string, file: string }, err: { message: string, stack: string }) {
    sendResponse({ testResult: { fileName: test.file, title: test.title, error: err.message, stack: err.stack } });
  });

  runner.on('pass', function(test: any) {
    sendResponse({ testResult: { fileName: test.file, title: test.title } });
  });

  // runner.on('start', function() {
  //   console.log('start');
  // });

  // runner.on('suite', function() {
  //   console.log('suite');
  // });

  // runner.on('test end', function() {
  //   console.log('test end');
  // });

  // runner.on('pending', function() {
  //   console.log('pending');
  // });

  // runner.on('end', function() {
  //   console.log('end');
  // });

  return {
    // epilogue: () => {
    //   console.log('done');
    // }
  };
};

let mocha = new Mocha({ reporter: reporter } as any);

process.on('message', (msg: MochaCommand) => {
  msg.testFiles.forEach(testFile => {
    mocha.addFile(testFile);
  });
  mocha.run((failures: number) => {
    sendResponse({ finished: { success: failures === 0 } });
    process.exit(0);
  });
});
