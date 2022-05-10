"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Action_1 = __importDefault(require("./src/services/Action"));
const checkArbitrage_1 = __importDefault(require("./src/services/checkArbitrage"));
const ExchangeData_1 = __importDefault(require("./src/services/ExchangeData"));
const Trigger_1 = __importDefault(require("./src/services/Trigger"));
const exchangesName = [
    "binance",
    "bitfinex",
    "ftx",
    "bittrex",
    "kucoin",
];
let cryptoComUrl = "wss://uat-stream.3ona.co/v2/market";
const LogAction = new Action_1.default(console.log);
const orderBookData = new ExchangeData_1.default(exchangesName, [
    { exchangeName: "cryptocom", url: cryptoComUrl },
]);
const orderbookTrigger = new Trigger_1.default(orderBookData, [LogAction], checkArbitrage_1.default);
orderbookTrigger.getOrderBookData();
