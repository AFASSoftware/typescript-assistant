#!/usr/bin/env node
"use strict";
var logger_1 = require('./logger');
var taskrunner_1 = require('./taskrunner');
var compiler_1 = require('./compiler');
var formatter_1 = require('./code-style/formatter');
var linter_1 = require('./code-style/linter');
var mocha_1 = require('./testing/mocha');
var bus_1 = require('./bus');
var git_1 = require('./git');
var configuration_1 = require('./configuration');
var path_1 = require('path');
var logger = logger_1.createConsoleLogger();
var taskRunner = path_1.sep === '\\' ? taskrunner_1.createWindowsTaskRunner() : taskrunner_1.createDefaultTaskRunner();
var bus = bus_1.createBus();
var argsOk = false;
var configuration = configuration_1.createConfiguration();
var compiler = compiler_1.createCompiler({ taskRunner: taskRunner, logger: logger, bus: bus });
var git = git_1.createGit({ taskRunner: taskRunner, logger: logger });
var formatter = formatter_1.createFormatter({ git: git, logger: logger, bus: bus });
var linter = linter_1.createLinter({ taskRunner: taskRunner, git: git, logger: logger, bus: bus });
var mocha = mocha_1.createMocha({ configuration: configuration, taskRunner: taskRunner, logger: logger, bus: bus, git: git });
if (process.argv.length === 3) {
    var command = process.argv[2];
    if (command === 'commit' || command === 'c') {
        // commit: format+compile+lint
        argsOk = true;
        commit({ formatter: formatter, linter: linter, bus: bus, compiler: compiler, git: git });
    }
}
else if (process.argv.length === 2) {
    // Normal operation: keep compiling+checking-format+linting
    formatter.startVerifying('compile-started');
    mocha.start('compile-compiled');
    linter.start('format-verified');
    compiler.start();
    argsOk = true;
}
if (!argsOk) {
    console.error('Usage: tsa || tsa c[ommit]');
    process.exit(1);
}
//# sourceMappingURL=index.js.map