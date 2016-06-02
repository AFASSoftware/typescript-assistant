"use strict";
var util_1 = require('../util');
var typescript_formatter_1 = require('typescript-formatter');
var replaceOptions = {
    replace: true,
    verbose: false,
    baseDir: process.cwd(),
    editorconfig: true,
    tslint: true,
    tsfmt: true,
    verify: false,
    tsconfig: undefined
};
var verifyOptions = {
    replace: false,
    verbose: false,
    baseDir: process.cwd(),
    editorconfig: true,
    tslint: true,
    tsfmt: true,
    verify: true,
    tsconfig: undefined
};
;
exports.createFormatter = function (config) {
    var logger = config.logger, bus = config.bus, git = config.git;
    var runFormatter = function (options) {
        return git.findChangedFiles().then(function (files) {
            files = files.filter(util_1.isTypescriptFile);
            logger.log('formatter', "checking " + files.length + " files...");
            return typescript_formatter_1.processFiles(files, options).then(function (resultMap) {
                var success = true;
                Object.keys(resultMap).forEach(function (fileName) {
                    var result = resultMap[fileName];
                    if (result.error) {
                        success = false;
                    }
                    if (result.message) {
                        logger.log('formatter', util_1.absolutePath(fileName) + ": " + result.message);
                    }
                });
                return success;
            });
        });
    };
    var verifyFormat = function () {
        // needs re-entrant fix
        return runFormatter(verifyOptions).then(function (success) {
            logger.log('formatter', success ? 'all files formatted' : 'unformatted files found');
            bus.signal(success ? 'format-verified' : 'format-errored');
        });
    };
    return {
        format: function () {
            return runFormatter(replaceOptions);
        },
        startVerifying: function (trigger) {
            bus.register(trigger, verifyFormat);
        },
        stopVerifying: function () {
            bus.unregister(verifyFormat);
        }
    };
};
exports.startFormatChecker = function (config) {
    var bus = config.bus;
    bus.register('lint-linted', function () {
        // todo
    });
    return {
        kill: function () { return undefined; }
    };
};
//# sourceMappingURL=formatter.js.map