"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function checkForArbitrage(askPrice, bidPrice) {
    if (askPrice >= bidPrice)
        return false;
    else {
        let difference = bidPrice - askPrice;
        let percentage_diffr = (difference / askPrice) * 100;
        // percentage_diffr = parseFloat(percentage_diffr).toPrecision(5);
        console.log({ percentage_diffr });
        if (percentage_diffr >= 1)
            return true;
        else
            return false;
    }
}
exports.default = checkForArbitrage;
