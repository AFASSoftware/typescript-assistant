"use strict";
var glob = require('glob');
exports.createGit = function (config) {
    var taskRunner = config.taskRunner, logger = config.logger;
    var git = {
        findChangedFiles: function (sinceLastPush) {
            var fallback = function () {
                // If not inside a git repository or no changed files found:
                return new Promise(function (resolve, reject) {
                    glob('**/*.ts', { ignore: ['node_modules/**', 'typings/**'] }, function (error, matches) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(matches);
                        }
                    });
                });
            };
            var args = sinceLastPush ? ['diff', '--name-only', '--diff-filter=ACM', 'origin/HEAD', 'HEAD'] : ['diff', '--name-only', '--diff-filter=ACM', 'HEAD'];
            return git.execute(args).then(function (files) {
                return files;
            }, fallback);
        },
        execute: function (args) {
            var lines = [];
            return new Promise(function (resolve, reject) {
                taskRunner.runTask('git', args, {
                    name: 'git',
                    logger: logger,
                    handleOutput: function (line) {
                        lines.push(line);
                        return true;
                    },
                    handleClose: function (code) {
                        if (code === 0) {
                            resolve(lines);
                            return true;
                        }
                        else {
                            reject();
                            return false;
                        }
                    }
                });
            });
        }
    };
    return git;
};
//# sourceMappingURL=git.js.map