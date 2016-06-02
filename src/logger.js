"use strict";
;
exports.createConsoleLogger = function () {
    var currentCategory;
    var setCategory = function (category) {
        if (category !== currentCategory) {
            console.log(category + ":");
            currentCategory = category;
        }
    };
    return {
        log: function (category, message) {
            setCategory(category);
            console.log('  ' + message);
        },
        error: function (category, message) {
            setCategory(category);
            console.error('! ' + message);
        },
        quit: function (category) {
            setCategory(category);
            console.error('X');
        }
    };
};
//# sourceMappingURL=logger.js.map