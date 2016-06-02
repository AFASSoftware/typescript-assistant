"use strict";
var path_1 = require('path');
exports.absolutePath = function (path) {
    return path_1.resolve(process.cwd(), path);
};
exports.isTypescriptFile = function (fileName) {
    return fileName.substr(fileName.length - 3) === '.ts';
};
//# sourceMappingURL=util.js.map