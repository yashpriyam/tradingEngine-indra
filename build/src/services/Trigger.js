"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Trigger {
    constructor(checkForArbitrage, exchangeData, action) {
        this.exchangeData = exchangeData;
        this.orderBookPriceMap = {};
        this.action = action;
        this.checkForArbitrage = checkForArbitrage;
    }
    getOrderBookData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.orderBookPriceMap = yield this.exchangeData.watchOrderBookData();
            }
            catch (error) {
                console.error({ error });
            }
            console.log({ priceOrderMap: this.orderBookPriceMap });
            for (const askPriceExchangeKey in this.orderBookPriceMap) {
                let askPrice = this.orderBookPriceMap[askPriceExchangeKey].askPrice;
                for (const bidPriceExchangeKey in this.orderBookPriceMap) {
                    let bidPrice = this.orderBookPriceMap[bidPriceExchangeKey].bidPrice;
                    if (this.checkForArbitrage(askPrice, bidPrice)) {
                        this.action.excuteAction({
                            askPriceExchange: askPriceExchangeKey,
                            bidPriceExchange: bidPriceExchangeKey,
                            message: "Percentage differnce is greater than 1.0",
                        });
                    }
                    else {
                        console.log("Pecentage differnce is not greater than 1.0");
                    }
                }
            }
        });
    }
}
exports.default = Trigger;
