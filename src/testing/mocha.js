"use strict";
var child_process_1 = require('child_process');
;
var relevantStackPart = function (stack) {
    var lines = stack.split('\n');
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('node_modules\\mocha') !== -1) {
            return lines.slice(0, i).join('\n');
        }
    }
    return stack;
};
exports.createMocha = function (config) {
    var logger = config.logger, bus = config.bus, configuration = config.configuration;
    var startMochaProcess = function () {
        var mochaProcess = child_process_1.fork(__dirname + '/mocha-process', [], {});
        mochaProcess.on('close', function (code) {
            if (code) {
                logger.log('mocha', 'mocha process exited with code ' + code);
            }
        });
        mochaProcess.on('message', function (response) {
            if (response.testResult) {
                var _a = response.testResult, fileName = _a.fileName, title = _a.title, error = _a.error, stack = _a.stack;
                if (error) {
                    logger.log('mocha', "Test failed: " + fileName + " " + title);
                    logger.log('mocha', relevantStackPart(stack));
                }
            }
            if (response.finished) {
                logger.log('mocha', response.finished.success ? 'All tests pass' : 'There were test failures');
            }
        });
        return mochaProcess;
    };
    var startMocha = function () {
        configuration.findCompiledTestFiles().then(function (files) {
            logger.log('mocha', "Testing " + files.length + " files...");
            var command = {
                testFiles: files
            };
            startMochaProcess().send(command);
        });
    };
    return {
        start: function (trigger) {
            bus.register(trigger, startMocha);
        },
        stop: function () {
            bus.unregister(startMocha);
        }
    };
};
//# sourceMappingURL=mocha.js.map