"use strict";
var util_1 = require('./util');
exports.createCompiler = function (config) {
    var taskRunner = config.taskRunner, logger = config.logger, bus = config.bus;
    var busy = true;
    var errors = [];
    var handleOutput = function (line) {
        if (/Starting incremental compilation...$/.test(line)) {
            busy = true;
            logger.log('compiler', 'compiling...');
            errors = [];
            bus.signal('compile-started');
        }
        else if (/Compilation complete\. Watching for file changes.$/.test(line)) {
            busy = false;
            logger.log('compiler', "ready, found " + errors.length + " errors");
            bus.signal(errors.length === 0 ? 'compile-compiled' : 'compile-errored');
        }
        else {
            var matches = /([^(]+)\((\d+),(\d+)\): (error TS\d+: )?(.*)$/.exec(line);
            if (matches) {
                errors.push(matches[0]);
                logger.log('compiler', util_1.absolutePath(matches[1]) + ":" + matches[2] + ":" + matches[3] + " " + matches[5]);
            }
            else {
                matches = /error TS\d+: (.+)$/.exec(line);
                if (matches) {
                    errors.push(matches[1]);
                    logger.log('compiler', "" + matches[1]);
                }
                else {
                    // just echo the output
                    logger.log('compiler', line);
                }
            }
        }
        return true;
    };
    var handleClose = function (code) {
        logger.error('compiler', "tsc exited with code " + code + ".");
        return true;
    };
    var task;
    return {
        start: function () {
            task = taskRunner.runTask('./node_modules/.bin/tsc', ['--watch'], {
                name: 'tsc',
                logger: logger,
                handleOutput: handleOutput,
                handleClose: handleClose
            });
        },
        stop: function () {
            task.kill();
            task = undefined;
        }
    };
};
//# sourceMappingURL=compiler.js.map