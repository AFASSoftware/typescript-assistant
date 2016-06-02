"use strict";
var child_process_1 = require('child_process');
;
var trimAndSplit = function (data) {
    if (!data) {
        return [];
    }
    if (!data.split) {
        // meaning data is a Buffer somehow...
        data = data.toString();
    }
    return data.split('\n').map(function (line) { return /^\s*(.*?)\s*$/.exec(line)[1]; }).filter(function (line) { return line.length > 0; });
};
exports.createDefaultTaskRunner = function () {
    return {
        runTask: function (command, args, config) {
            var loggerCategory = config.name;
            var logger = config.logger;
            logger.log(loggerCategory, "running command " + command + " " + args.join(' '));
            var task = child_process_1.spawn(command, args);
            task.stdout.on('data', function (data) {
                trimAndSplit(data).forEach(function (line) {
                    var handled = false;
                    if (config.handleOutput) {
                        handled = config.handleOutput(line);
                    }
                    if (!handled) {
                        logger.log(loggerCategory, line);
                    }
                });
            });
            task.stderr.on('data', function (data) {
                trimAndSplit(data).forEach(function (line) {
                    var handled = false;
                    if (config.handleOutput) {
                        handled = config.handleError(line);
                    }
                    if (!handled) {
                        logger.error(loggerCategory, line);
                    }
                });
            });
            task.on('close', function (code) {
                var handled = false;
                if (config.handleClose) {
                    handled = config.handleClose(code);
                }
                if (!handled) {
                    logger.quit(loggerCategory);
                }
            });
            return {
                kill: function () {
                    task.kill();
                }
            };
        }
    };
};
exports.createWindowsTaskRunner = function () {
    var delegate = exports.createDefaultTaskRunner();
    var translateToWindows = function (command) {
        if (command.charAt(0) === '.') {
            // we just assume it is something from the ./node_modules/.bin/ folder
            command += '.cmd';
        }
        return command.replace(/\//g, '\\');
    };
    return {
        runTask: function (command, args, config) {
            return delegate.runTask(translateToWindows(command), args, config);
        }
    };
};
//# sourceMappingURL=taskrunner.js.map