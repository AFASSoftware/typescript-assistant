"use strict";
var util_1 = require('../util');
var child_process_1 = require('child_process');
;
exports.createLinter = function (config) {
    var logger = config.logger, bus = config.bus, git = config.git;
    var lintProcess;
    var running = false;
    var rescheduled = false;
    var startLint = function () {
        rescheduled = false;
        running = true;
        git.findChangedFiles().then(function (files) {
            files = files.filter(util_1.isTypescriptFile);
            logger.log('linter', "Linting " + files.length + " files...");
            var command = {
                filesToLint: files
            };
            lintProcess.send(command);
        });
    };
    var lint = function () {
        if (rescheduled) {
            return;
        }
        else if (running) {
            rescheduled = true;
        }
        else {
            startLint();
        }
    };
    return {
        start: function (trigger) {
            lintProcess = child_process_1.fork(__dirname + '/linter-process', [], {});
            lintProcess.on('close', function (code) {
                logger.log('linter', 'linting process exited with code ' + code);
            });
            lintProcess.on('message', function (response) {
                if (response.violation) {
                    var _a = response.violation, fileName = _a.fileName, line = _a.line, column = _a.column, message = _a.message;
                    logger.log('linter', util_1.absolutePath(fileName) + ":" + line + ":" + column + " " + message);
                }
                if (response.finished) {
                    running = false;
                    logger.log('linter', response.finished.success ? 'All files are ok' : 'Linting problems found');
                    bus.signal(response.finished.success ? 'lint-linted' : 'lint-errored');
                    if (rescheduled) {
                        startLint();
                    }
                }
            });
            bus.register(trigger, lint);
        },
        stop: function () {
            bus.unregister(lint);
            lintProcess.kill();
            lintProcess = undefined;
        }
    };
};
//# sourceMappingURL=linter.js.map