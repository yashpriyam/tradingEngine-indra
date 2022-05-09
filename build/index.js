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
const Action_1 = __importDefault(require("./src/services/Action"));
const checkArbitrage_1 = __importDefault(require("./src/services/checkArbitrage"));
const ExchangeData_1 = __importDefault(require("./src/services/ExchangeData"));
const Trigger_1 = __importDefault(require("./src/services/Trigger"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    const exchangesName = [
        "binance",
        "bitfinex",
        "ftx",
        "bittrex",
        "kucoin",
    ];
    const LogAction = new Action_1.default(console.log);
    const orderBookData = new ExchangeData_1.default(exchangesName);
    // const orderBookPriceMap = await orderBookData.watchOrderBookData();
    // console.log({ orderBookPriceMap });
    const orderbookTrigger = new Trigger_1.default(checkArbitrage_1.default, orderBookData, LogAction);
    yield orderbookTrigger.getOrderBookData();
}))();
