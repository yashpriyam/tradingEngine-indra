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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
class Trigger {
    constructor(exchangeData, actions, checkCondition) {
        this.exchangeData = exchangeData;
        this.actions = actions;
        this.checkCondition = checkCondition;
    }
    getOrderBookData() {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let orderBookGenerator = this.exchangeData.getOrderBookData();
            try {
                for (var orderBookGenerator_1 = __asyncValues(orderBookGenerator), orderBookGenerator_1_1; orderBookGenerator_1_1 = yield orderBookGenerator_1.next(), !orderBookGenerator_1_1.done;) {
                    let orderBookPriceMap = orderBookGenerator_1_1.value;
                    console.log({ priceOrderMap: orderBookPriceMap });
                    for (const symbol in orderBookPriceMap) {
                        for (const askPriceExchangeKey in orderBookPriceMap[symbol]) {
                            let askPrice = orderBookPriceMap[symbol][askPriceExchangeKey].askPrice;
                            for (const bidPriceExchangeKey in orderBookPriceMap[symbol]) {
                                if (askPriceExchangeKey === bidPriceExchangeKey)
                                    continue;
                                let bidPrice = orderBookPriceMap[symbol][bidPriceExchangeKey].bidPrice;
                                if (this.checkCondition(askPrice, bidPrice)) {
                                    this.actions.forEach((singleAction) => {
                                        singleAction.excuteAction({
                                            symbol,
                                            askPriceExchange: askPriceExchangeKey,
                                            bidPriceExchange: bidPriceExchangeKey,
                                            message: "Percentage differnce is greater than 1.0",
                                        });
                                    });
                                }
                                else {
                                    console.log("Pecentage differnce is not greater than 1.0");
                                }
                            }
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (orderBookGenerator_1_1 && !orderBookGenerator_1_1.done && (_a = orderBookGenerator_1.return)) yield _a.call(orderBookGenerator_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
}
exports.default = Trigger;
