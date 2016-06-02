"use strict";
exports.createBus = function () {
    var allSubscribers = {};
    return {
        signal: function (eventType) {
            var subscribers = allSubscribers[eventType];
            if (subscribers) {
                subscribers.forEach(function (s) { return s(); });
            }
        },
        register: function (type, callback) {
            var subscribers = allSubscribers[type];
            if (!subscribers) {
                subscribers = allSubscribers[type] = [];
            }
            subscribers.push(callback);
        },
        unregister: function (callback) {
            Object.keys(allSubscribers).forEach(function (eventType) {
                var subscribers = allSubscribers[eventType];
                var index = subscribers.indexOf(callback);
                if (index >= 0) {
                    subscribers.splice(index, 1);
                }
            });
        }
    };
};
//# sourceMappingURL=bus.js.map