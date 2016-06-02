"use strict";
var glob = require('glob');
var path_1 = require('path');
var fs_1 = require('fs');
var DEFAULT_CONFIG = {
    testDir: 'test'
};
;
exports.createConfiguration = function () {
    // todo load and parse tsa.json5 file if it exists
    var tsaConfig = DEFAULT_CONFIG;
    // tsa will not run without a tsconfig.json file
    /* tslint:disable:no-require-imports */
    var tsConfig = JSON.parse(fs_1.readFileSync('./tsConfig.json', 'UTF-8'));
    //let tsConfig = require('./tsconfig.json');
    var compiledTestFolder = path_1.join(tsConfig.compilerOptions.outDir, tsaConfig.testDir);
    return {
        findCompiledTestFiles: function () {
            return new Promise(function (resolve, reject) {
                glob(path_1.join(compiledTestFolder, '**/*.js'), {}, function (error, matches) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(matches);
                    }
                });
            });
        }
    };
};
//# sourceMappingURL=configuration.js.map