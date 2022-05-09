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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ccxt_pro_1 = __importDefault(require("ccxt.pro"));
class ExchangeData {
    constructor(exchanges) {
        this.exchanges = exchanges;
        this.orderBookPriceMap = {};
    }
    watchOrderBookData() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const exchangeName of this.exchanges) {
                const exchange = new ccxt_pro_1.default[exchangeName]({ enableRateLimit: true });
                const orderbookData = yield exchange.watchOrderBook("ETH/USDT");
                this.orderBookPriceMap[exchangeName] = {};
                this.orderBookPriceMap[exchangeName]["askPrice"] =
                    orderbookData["asks"][0][0];
                this.orderBookPriceMap[exchangeName]["bidPrice"] =
                    orderbookData["bids"][0][0];
            }
            return this.orderBookPriceMap;
        });
    }
}
exports.default = ExchangeData;
