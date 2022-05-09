"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Action {
    constructor(callback) {
        this.callback = callback;
    }
    excuteAction(data) {
        this.callback(data);
    }
}
exports.default = Action;
